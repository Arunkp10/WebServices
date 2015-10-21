/*
Request parameters:
resource_id:

Answer object:
{
	result: "ok",
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

		if (!query.resource_id)
		{
			self.emit ('done', 'Parameter missing: resource_id');
			return;
		}
		var resource_id = parseInt (query.resource_id);

		pg.connect (global.database, function (err, client, done)
		{
			// Find record for specified file id
			client.query ('DELETE FROM test_resource WHERE id=$1', [resource_id], function (err, result)
			{
				done ();

				if (err)
				{
					self.emit ('done', err.toString ());
					return;
				}

				if (result.rowCount == 0)
				{
					self.emit ('done', 'Resource id ' + resource_id + ' not found');
					return;
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
