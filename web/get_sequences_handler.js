/*
Request parameters:
suite_id (required)

Answer object:
{
	result: "ok",
	seqeuences:
	[
	]

	Array is sorted by newset first
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

		if (!query.suite_id)
		{
			self.emit ('done', 'Parameter missing: suite_id');
			return;
		}
		var suite_id = parseInt (query.suite_id);

		pg.connect (global.database, function (err, client, done)
		{
			client.query ('SELECT * FROM sequence WHERE suite_id=$1 ORDER BY id', [suite_id], function (err, result)
			{
				done ();

				if (err)
				{
					self.emit ('done', err.toString ());
					return;
				}

				answer.sequences = [];
				for (var n in result.rows)
				{
					// Remove code from returned objects in case it's very large
					var sequence = result.rows[n];
					delete sequence.code;
					answer.sequences.push (sequence);
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
