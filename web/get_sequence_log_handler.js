/*
Request parameters:
id: sequence id

Answer object:
{
	result: "ok",
	entries: <array of log entry objects>
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

		pg.connect (global.database, function (err, client, done)
		{
			client.query ('SELECT * FROM sequence_log WHERE sequence_id=$1 ORDER BY id DESC', [sequence_id], function (err, result)
			{
				done ();

				if (err)
				{
					self.emit ('done', err.toString ());
					return;
				}

				answer.entries = [];
				for (var n in result.rows)
				{
					answer.entries.push (result.rows[n]);
				}

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
