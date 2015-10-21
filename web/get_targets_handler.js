/*
Request parameters:
<none>

Answer object:
{
	result: "ok",
	targets: <array of target objects>
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

		var run_id = query.run_id;
		if (!run_id)
		{
			self.emit ('done', 'Parameter missing: run_id');
			return;
		}

		pg.connect (global.database, function (err, client, done)
		{
			client.query ('SELECT * FROM test_target WHERE run_id=$1 ORDER BY id DESC', [run_id], function (err, result)
			{
				done ();

				if (err)
				{
					self.emit ('done', err.toString ());
					return;
				}

				answer.targets = [];
				for (var n in result.rows)
				{
					answer.targets.push (result.rows[n]);
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
