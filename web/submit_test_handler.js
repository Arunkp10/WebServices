/*
Request parameters:
id: test id

Answer object:
{
	result: "ok",
	run: new run object
}
*/

var events = require ('events');
var pg = require ('pg');
var child = require ('child_process');
var needle = require ('needle');
var q = require ('q');
var fs = require ('fs');
var aws = require ('aws-sdk');

function Handler ()
{
	events.EventEmitter.call (this);

	this.handle = function (query, answer)
	{
		var self = this;

		var description = query.description || '';

		var test_id = parseInt (query.id);
		if (!test_id)
		{
			self.emit ('done', 'Parameter missing: id');
			return;
		}

		pg.connect (global.database, function (err, client, done)
		{
			client.query ('SELECT directory FROM test WHERE id=$1', [test_id], function (err, result)
			{
				if (err)
				{
					done ();
					self.emit ('done', err.toString ());
					return;
				}

				if (result.rows.length == 0)
				{
					done ();
					self.emit ('done', 'Test id ' + test_id + ' not found');
					return;
				}

				var directory = result.rows[0].directory;
				var temp_dir = directory + '/temp';


				// Delete and create the temp directory
				var command = 'rm -fr ' + temp_dir + ' ; mkdir ' + temp_dir;
				child.exec (command, function (err, stdout, stderr)
				{
					if (err)
					{
						done ();
						self.emit ('done', err.toString ());
						return;
					}

					// Fetch external resources, e.g. files from github
					client.query ('SELECT * FROM test_resource WHERE test_id=$1', [test_id], function (err, result)
					{
						if (err)
						{
							done ();
							self.emit ('done', err.toString ());
							return;
						}

						fetchResources (result.rows, temp_dir, function (err)
						{
							if (err)
							{
								done ();
								self.emit ('done', err);
								return;
							}

							// Create a new test_run record
							client.query ('INSERT INTO test_run (test_id, description) VALUES ($1, $2) RETURNING *', [test_id, description], function (err, result)
							{
								if (err)
								{
									done ();
									self.emit ('done', err.toString ());
									return;
								}

								var run = result.rows[0];

								// Copy the static files into the temp directory
								// Create a zip file of the test's uploaded files as the test package for this run with a unique filename
								var d = new Date();
								var package_file = 'test_' + test_id + '_' + d.getFullYear() + (d.getMonth()+1) + d.getDate();
								package_file += d.getHours() + d.getMinutes() + d.getSeconds() + d.getMilliseconds() + '.zip';
								var command = 'cp ' + directory + '/* ' + temp_dir + ' ; rm -f ./packages/' + package_file + ' ; zip --junk-paths ./packages/' + package_file + ' ' + temp_dir + '/*';
								child.exec (command, function (err, stdout, stderr)
								{
									if (err)
									{
										done ();
										self.emit ('done', err.toString ());
										return;
									}

									// Create one record per target in test_target table referencing the new run id
									client.query ('INSERT INTO test_target (target, run_id) (SELECT unnest(targets), $2 FROM test WHERE id=$1)', [test_id, run.id], function (err, result)
									{
										if (err)
										{
											done ();
											self.emit ('done', err.toString ());
											return;
										}

										// Write package name into test_run record
										client.query ('UPDATE test_run SET package=$1 WHERE id=$2 RETURNING *', [package_file, run.id], function (err, result)
										{
											if (err)
											{
												done ();
												self.emit ('done', err.toString ());
												return;
											}

											// Get updated run record
											client.query ('SELECT * from test_runs_inc_outcomes WHERE id=$1', [run.id], function (err, result)
											{
												done ();

												if (err)
												{
													self.emit ('done', err.toString ());
													return;
												}

												run = result.rows[0];

												// Push status change to interested web pages
												//global.io.to ('run-' + run.id).emit ('run-update', run);

												answer.run = run;
												self.emit ('done', null, answer);
											});
										});
									});
								});
							});
						});
					});
				});
			});
		});
	};
};

function fetchResources (rows, directory, callback)
{
	// Form an array of promises for the individual fetches
	var fetches = [];
	rows.forEach (function (row)
	{
		switch (row.type)
		{
		case 'github':
			fetches.push (fetchGithubResource (row.definition, directory));
			break;

		case 's3':
			fetches.push (fetchS3Resource (row.definition, directory));
			break;

		case 'url':
			fetches.push (fetchUrlResource (row.definition, directory));
			break;
		}
	});

	// Anything to do?
	if (fetches.length == 0)
	{
		callback (null);
		return;
	}

	// Wait for them all to finish, or for there to be an error
	q.all (fetches)
	.done (function () {callback (null);}, function (reason) {callback (reason);});
}

function http_get (url, options)
{
	return q.nfcall (needle.get, url, options).then (function (value)
	{
		if (value[0].statusCode != 200)
			throw 'Status code ' + value[0].statusCode + ' returned calling ' + url;

		return value[0].body;
	});
}

function fetchGithubResource (definition, directory)
{
	// Form url of github resource
	var url = 'https://api.github.com/repos';
	url += '/' + definition.owner;
	url += '/' + definition.repository + '/contents';

	// Add initial forward slash if not specified in path (although github does manage wihtout it)
	if (definition.path.charAt(0) != '/')
		url += '/';

	url += definition.path;

	// Add authorisation for ATS3USER so we get a decent API quota, and can access private repositories
	var options = {follow: true, headers: {Authorization: 'Basic YXRzM3VzZXI6cmgwZWxlbWVudHM='}};

	// Get info about requested resource from github
	return http_get (url, options)
	.then (function (info)
	{
		// If we get an array back then the request was for a directory, so fetch each file
		if (Array.isArray (info))
		{
			var downloads = [];
			info.forEach (function (entry)
			{
				if (entry.type == 'file')
				{
					var options = {follow: true,
						headers: {Authorization: 'Basic YXRzM3VzZXI6cmgwZWxlbWVudHM=', Accept: 'application/vnd.github.VERSION.raw'},
						output: directory + '/' + entry.name};

					downloads.push (http_get (entry.download_url, options)
						.fail (function () { throw 'Failed to fetch ' + entry.name + ' from github'; }));
				}
			});
			return q.all (downloads);
		}
		else
		{
			// It's a single object, so get the content from it (max 1 MB)
			var data = new Buffer (info.content, 'base64');
			return q.nfcall (fs.writeFile, directory + '/' + info.name, data);
		}
	});
}

function fetchS3Resource (definition, directory)
{
	// Extract the filename from the end of the path
	var p = definition.path.lastIndexOf ('/');
	if (p != -1)
		var filename = definition.path.slice (p + 1);
	else
		var filename = definition.path;

	var s3 = new aws.S3 ();

	return q.ninvoke (s3, 'getObject', {Bucket: definition.bucket, Key: definition.path})
	.then (function (data)
	{
		return q.nfcall (fs.writeFile, directory + '/' + filename, data.Body)
		.fail (function (err)
		{
			throw 'Failed to write file ' + err.path + ' (' + err.code + ')';
		});
	}, function (err)
	{
		throw 'Failed to fetch ' + definition.bucket + '/' + definition.path + ' from S3 (' + err.message + ')';
	});
}

function fetchUrlResource (definition, directory)
{
}

Handler.prototype = Object.create (events.EventEmitter.prototype);

exports.createHandler = function()
{
	return new Handler();
};
