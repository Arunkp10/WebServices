/*
Request parameters:
file_id:
content:

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

	this.handle = function (query, answer)
	{
		var self = this;

		if (!query.file_id)
		{
			self.emit ('done', 'Parameter missing: file_id');
			return;
		}
		var file_id = parseInt (query.file_id);

		if (!query.content)
		{
			self.emit ('done', 'Parameter missing: content');
			return;
		}
		var content = query.content;

		pg.connect (global.database, function (err, client, done)
		{
			// Find record for specified file id
			client.query ('SELECT path FROM test_file WHERE id=$1', [file_id], function (err, result)
			{
				done ();

				if (err)
				{
					self.emit ('done', err.toString ());
					return;
				}

				if (result.rows.length == 0)
				{
					self.emit ('done', 'File id ' + id + ' not found');
					return;
				}

				var path = result.rows[0].path;

				// Overwrite the file with the new content
				fs.writeFile (path, content, {mode: 0777}, function (err)
				{
					if (err)
					{
						self.emit ('done', 'Error ' + err.code + ' writing file ' + path);
						return;
					}

					self.emit ('done', null, answer);
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
