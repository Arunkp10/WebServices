/*
Request parameters:
id: id of test record

Uploaded file should be in body as multi-part form

Answer object:
{
	result: "ok",
}
*/

var events = require ('events');
var pg = require ('pg');
var fs = require ('fs');

function Handler ()
{
	events.EventEmitter.call (this);

	this.handle = function (query, answer, files)
	{
		var self = this;

		if (!query.id)
		{
			self.emit ('done', 'Parameter missing: id');
			return;
		}
		var test_id = parseInt (query.id);

		if (files.length == 0)
		{
			self.emit ('done', 'No files attached');
			return;
		}

		pg.connect (global.database, function (err, client, done)
		{
			// Get directory where files are stored for this test
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

				// Build array of new file records for result
				answer.files = [];

				// Count how many we've added
				var files_inserted = 0, total_files = Object.keys (files).length;

				try
				{
					Object.keys (files).forEach(function (key)
					{
						var file = files [key];

						// Move received file into test's directory, renaming to original transmitted filename
						var dest = result.rows[0].directory + '/' + file.originalname;
						var src = './' + file.path;
						fs.renameSync (src, dest);
						fs.chmodSync (dest, 0777);

						// Add a record to the files table
						client.query ('INSERT INTO test_file (test_id, filename, path, type) VALUES ($1, $2, $3, \'binary\') RETURNING *',
							[test_id, file.originalname, dest], function (err, result)
						{
							if (err)
							{
								done ();
								self.emit ('done', err.toString ());
								return;
							}

							answer.files.push (result.rows[0]);

							// Check if we've inserted as many records as there were files uploaded, if so then send the answer
							if (++files_inserted == total_files)
							{
								done ();
								self.emit ('done', null, answer);
							}
						});
					});
				}
				catch (e)
				{
					done ();
					self.emit ('done', e.toString());
					return;
				};
			});
		});
	};
};

Handler.prototype = Object.create (events.EventEmitter.prototype);

exports.createHandler = function()
{
	return new Handler();
};
