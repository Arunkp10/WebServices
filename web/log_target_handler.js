/*
Request parameters:
id: target id

Answer object:
{
	result: "ok", or "error" if this target isn't executing
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
		var target_id = parseInt (query.id);

		var entry = query.entry;
		if (!entry)
		{
			self.emit ('done', 'parameter missing: entry');
			return;
		}

		var severity = query.severity;
		if (!severity)
		{
			self.emit ('done', 'parameter missing: severity');
			return;
		}

		pg.connect (global.database, function (err, client, done)
		{
			client.query ('SELECT COUNT(*) AS total FROM test_target WHERE id=$1 AND status=\'executing\'', [target_id], function (err, result)
			{
				if (err)
				{
					done ();
					self.emit ('done', err.toString ());
					return;
				}

				if (result.rows[0].total == 0)
				{
					done ();
					self.emit ('done', 'No executing target found for id ' + target_id);
					return;
				}

				client.query ('INSERT INTO test_log (target_id, entry, severity) VALUES ($1, $2, $3) RETURNING *', [target_id, entry, severity], function (err, result)
				{
					done ();

					if (err)
					{
						self.emit ('done', err.toString ());
						return;
					}

					// Push new log entry to pages registered for changes to target
					global.io.to ('target-' + target_id).emit ('new-log', result.rows[0]);

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
