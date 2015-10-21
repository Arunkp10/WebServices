/*
Request parameters:
suite_id: id of containing suite (required)
name: name of new sequence (optional, defaults to blank)
code: code for new sequence (optional, defaults to blank)

Answer object:
{
	result: "ok",
	sequence: <new sequence object>
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

		var name = query.name || '';
		var code = query.code || '';

		pg.connect (global.database, function (err, client, done)
		{
			client.query ('INSERT INTO sequence (suite_id, name, code) VALUES ($1, $2, $3) RETURNING *', [suite_id, name, code], function (err, result)
			{
				done ();

				if (err)
				{
					self.emit ('done', err.toString ());
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
