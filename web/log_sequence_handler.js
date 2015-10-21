/*
Request parameters:
id: sequence id

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
		var sequence_id = parseInt (query.id);

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
			client.query ('INSERT INTO sequence_log (sequence_id, entry, severity) VALUES ($1, $2, $3) RETURNING *', [sequence_id, entry, severity], function (err, result)
			{
				done ();

				if (err)
				{
					self.emit ('done', err.toString ());
					return;
				}

				// Push new log entry to pages registered for changes to sequence
				global.io.to ('sequence-' + sequence_id).emit ('new-sequence-log', result.rows[0]);

				answer.entry = result.rows[0];
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
