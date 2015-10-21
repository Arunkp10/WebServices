/*
Request parameters:
test_id: id of related test record
filename:

Answer object:
{
	result: "ok",
	file: <new file object>
}
*/

var events = require ('events');
var pg = require ('pg');
var fs = require ('fs');

function Handler ()
{
	events.EventEmitter.call (this);

	this.handle = function (query, answer)
	{
		var self = this;

		if (!query.test_id)
		{
			self.emit ('done', 'Parameter missing: test_id');
			return;
		}
		var test_id = parseInt (query.test_id);

		if (!query.filename)
		{
			self.emit ('done', 'Parameter missing: filename');
			return;
		}
		var filename = query.filename;

		// Get the test record in order to get the directory in which to create the file
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
					self.emit ('done', 'Test id ' + id + ' not found');
					return;
				}

				var directory = result.rows[0].directory;

				// Create full filename, using directory
				var path = directory + '/' + filename;

				// Create an empty file, fail if file already exists
				fs.open (path, 'wx', 0777, function (err, fd)
				{
					if (err)
					{
						done ();
						if (err.code == 'EEXIST')
							self.emit ('done', 'File ' + filename + ' already exists');
						else
							self.emit ('done', 'Error ' + err.code + ' creating file ' + path);
						return;
					}

					fs.closeSync (fd);

					client.query ('INSERT INTO test_file (test_id, filename, path, type) VALUES ($1, $2, $3, \'text\') RETURNING *', [test_id, filename, path], function (err, result)
					{
						done ();

						if (err)
						{
							self.emit ('done', err.toString ());
							return;
						}

						answer.file = result.rows[0];
						self.emit ('done', null, answer);
					});
				});
			});
		});
	};
};

Handler.prototype = Object.create (events.EventEmitter.prototype);

exports.createHandler = function()
{
	return new Handler();
};
