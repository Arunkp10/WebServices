/*
Request parameters:
<none>

Answer object:
{
	result: "ok",
	suites: <array of suite objects>
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

		pg.connect (global.database, function (err, client, done)
		{
			client.query ('SELECT * FROM suites_inc_test_count ORDER BY id', [], function (err, result)
			{
				done ();

				if (err)
				{
					self.emit ('done', err.toString ());
					return;
				}

				answer.suites = [];
				for (var n in result.rows)
				{
					answer.suites.push (result.rows[n]);
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
