/*
Request parameters:
id: target id

Answer object:
{
	result: "ok", or "error" if target is not in executing state
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

		var id = parseInt (query.id);
		if (!id)
		{
			self.emit ('done', 'Parameter missing: id');
			return;
		}

		var outcome = query.outcome;
		if (!outcome)
		{
			self.emit ('done', 'Parameter missing: outcome');
			return;
		}

		pg.connect (global.database, function (err, client, done)
		{
			client.query ('UPDATE test_target SET status=\'done\', outcome=$2 WHERE id=$1 AND status=\'executing\' RETURNING *', [id, outcome], function (err, result)
			{
				if (err)
				{
					done ();
					self.emit ('done', err.toString ());
					return;
				}

				if (result.rowCount == 0)
				{
					done ();
					self.emit ('done', 'No executing target found for id ' + id);
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
