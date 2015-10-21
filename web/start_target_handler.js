/*
Request parameters:
id: target id

Answer object:
{
	result: "ok", or "error" if target is not in pending state (because another caller has already started this target)
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

		var agent_id = query.agent_id;
		if (!agent_id)
		{
			self.emit ('done', 'parameter missing: agent_id');
			return;
		}

		var agent_name = query.agent_name;
		if (!agent_name)
		{
			self.emit ('done', 'Parameter missing: agent_name');
			return;
		}

		pg.connect (global.database, function (err, client, done)
		{
			client.query ('UPDATE test_target SET status=\'executing\', agent_id=$1, agent_name=$2 WHERE id=$3 AND status=\'pending\' RETURNING *', [agent_id, agent_name, id], function (err, result)
			{
				done ();

				if (err)
				{
					self.emit ('done', err.toString ());
					return;
				}

				if (result.rowCount == 0)
				{
					self.emit ('done', 'No pending target found for id ' + id);
					return;
				}

				// TODO Delete package file - agent must ensure it has successfully downloaded by now

				// Push status change to interested web pages
				global.io.to ('run-' + result.rows[0].run_id).emit ('run-target', result.rows[0]);
				global.io.to ('target-' + id).emit ('update-target', result.rows[0]);

				self.emit ('done', null, answer);
			});
		});
	};
};

Handler.prototype = Object.create (events.EventEmitter.prototype);

exports.createHandler = function()
{
	return new Handler();
};
