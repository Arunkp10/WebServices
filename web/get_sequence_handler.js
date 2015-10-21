/*
Request parameters:
id: sequence record id

Answer object:
{
	result: "ok",
	sequence: <sequence object>
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
			client.query ('SELECT * FROM sequence WHERE id=$1', [sequence_id], function (err, result)
			{
				done ();

				if (err)
				{
					self.emit ('done', err.toString ());
					return;
				}

				if (result.rows.length == 0)
				{
					self.emit ('done', 'Sequence id ' + sequence_id + ' not found');
					return;
				}

				answer.sequence = result.rows[0];

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
