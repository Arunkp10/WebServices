/*
Request parameters:
id: test id
targets: array of target names as strings

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

		// Get required test id
		var id = query.id;
		if (!id)
		{
			self.emit ('done', 'Parameter missing: id');
			return;
		}

		// Get required target array - if missing then assume empty array
		var targets = query.targets;
		if (!targets)
			targets = [];

		pg.connect (global.database, function (err, client, done)
		{
			client.query ('UPDATE test SET targets=$1 WHERE id=$2', ['{' + targets.toString() + '}', id], function (err, result)
			{
				done ();

				if (err)
				{
					self.emit ('done', err.toString ());
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
