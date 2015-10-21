/*
Request parameters:
target

Answer object:
{
	result: "ok",
	runs: <array of run details>
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

		var targets = query.targets;
		if (!targets)
		{
			self.emit ('done', 'Parameter missing: targets');
			return;
		}

		if (targets.length == 0)
		{
			self.emit ('done', 'Parameter targets has zero length');
			return;
		}

		pg.connect (global.database, function (err, client, done)
		{
			var clause = '';
			for (n = 1; n <= targets.length; n++)
				if (n == 1)
					clause = '($1';
				else
					clause += ',$' + n;
			clause += ')';
			client.query ('SELECT r.package AS package, t.id AS id FROM test_run r JOIN test_target t ON r.id=t.run_id WHERE t.target IN ' + clause + ' AND t.status=\'pending\'', targets, function (err, result)
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
