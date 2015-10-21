/*
Request parameters:
<none>

Answer object:
{
	result: "ok",
	runs: <array of run objects>
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

		var test_id = query.test_id;
		if (!test_id)
		{
			self.emit ('done', 'Parameter missing: test_id');
			return;
		}

		pg.connect (global.database, function (err, client, done)
		{
			client.query ('SELECT * FROM test_runs_inc_outcomes WHERE test_id=$1 ORDER BY id DESC', [test_id], function (err, result)
			{
				done ();

				if (err)
				{
					self.emit ('done', err.toString ());
					return;
				}

				answer.runs = [];
				for (var n in result.rows)
				{
					answer.runs.push (result.rows[n]);
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
