/*
Request parameters:
id: suite record id

Answer object:
{
	result: "ok",
	suite: <suite object>
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

		var id = query.id;
		if (!id)
		{
			self.emit ('done', 'Parameter missing: id');
			return;
		}

		pg.connect (global.database, function (err, client, done)
		{
			client.query ('SELECT * FROM suites_inc_test_count WHERE id=$1', [id], function (err, result)
			{
				done ();

				if (err)
				{
					self.emit ('done', err.toString ());
					return;
				}

				if (result.rows.length == 0)
				{
					self.emit ('done', 'Suite id ' + id + ' not found');
					return;
				}

				answer.suite = result.rows[0];

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
