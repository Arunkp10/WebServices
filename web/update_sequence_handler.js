/*
Request parameters:
id: sequence id (required)
name: new name for sequence (optional)
code: new code for sequence (optional)

Answer object:
{
	result: "ok",
	sequence: <modified sequence object>
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

		var name = query.name;
		var code = query.code;

		pg.connect (global.database, function (err, client, done)
		{
			client.query ('UPDATE sequence SET name=COALESCE($1,name), code=COALESCE($2,code) WHERE id=$3 RETURNING *', [name, code, id], function (err, result)
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
