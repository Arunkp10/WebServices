/*
Request parameters:
name: name of new test suite

Answer object:
{
	result: "ok",
	suite: <new suite object>
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

		var name = query.name;
		if (!name)
		{
			self.emit ('done', 'Parameter missing: name');
			return;
		}

		pg.connect (global.database, function (err, client, done)
		{
			client.query ('INSERT INTO suite (name) VALUES ($1) RETURNING ID', [name], function (err, result)
			{
				done ();

				if (err)
				{
					self.emit ('done', err.toString ());
					return;
				}

				answer.suite = {id: result.rows[0].id, name: name};
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
