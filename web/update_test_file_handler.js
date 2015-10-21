/*
Request parameters:
id: file id (required)
type: new type for sequence (nothing else is currently changeable)

Answer object:
{
	result: "ok",
	file: <modified file object>
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
		var file_id = parseInt (query.id);

		var type = query.type;

		pg.connect (global.database, function (err, client, done)
		{
			client.query ('UPDATE test_file SET type=COALESCE($2,type) WHERE id=$1 RETURNING *', [file_id, type], function (err, result)
			{
				done ();

				if (err)
				{
					self.emit ('done', err.toString ());
					return;
				}

				answer.file = result.rows[0];
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
