/*
Request parameters:
id: test id

Answer object:
{
	result: "ok",
}
*/

var events = require ('events');
var pg = require ('pg');
var rimraf = require ('rimraf');

function Handler ()
{
	events.EventEmitter.call (this);

	this.handle = function (query, answer)
	{
		var self = this;

		var test_id = parseInt (query.id);
		if (!test_id)
		{
			self.emit ('done', 'Parameter missing: test_id');
			return;
		}

		pg.connect (global.database, function (err, client, done)
		{
			// Get directory where test files are held
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

				// Delete directory and all files in it - node's fs doesn't delete non-empty directories
				rimraf (directory, function (err)
				{
					if (err)
					{
						self.emit ('done', err.toString ());
						return;
					}

					// Delete record from database
					client.query ('DELETE FROM test WHERE id=$1', [test_id], function (err, result)
					{
						done ();

						if (err)
						{
							self.emit ('done', err.toString ());
							return;
						}

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
