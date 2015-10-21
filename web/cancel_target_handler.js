/*
Request parameters:
id: target id

Answer object:
{
	result: "ok"
}
*/

var events = require ('events');
var pg = require ('pg');

function Handler ()
{
	events.EventEmitter.call (this);

	this.handle = function (query, answer)
	{
		var self = this;

		if (!query.id)
		{
			self.emit ('done', 'Parameter missing: id');
			return;
		}
		var id = parseInt (query.id);

		pg.connect (global.database, function (err, client, done)
		{
			client.query ('UPDATE test_target SET status=\'cancelled\', outcome=\'fail\' WHERE id=$1 RETURNING *', [id], function (err, result)
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
					self.emit ('done', 'Target ' + id + ' not found');
					return;
				}

				var target = result.rows[0];

				// Get parent run record so we can push it
				client.query ('SELECT * FROM test_runs_inc_outcomes WHERE id=$1', [target.run_id], function (err, result)
				{
					done ();

					if (err)
					{
						self.emit ('done', err.toString ());
						return;
					}

					var run = result.rows[0];

					// Push status change to interested web pages
					global.io.to ('run-' + target.run_id).emit ('run-target', target);
					global.io.to ('test-' + run.test_id).emit ('test-run', run);
					global.io.to ('target-' + id).emit ('update-target', target);

					answer.target = target;
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
