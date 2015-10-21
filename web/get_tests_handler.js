/*
Request parameters:
None

Answer object:
{
	result: "ok",
	tests:
	[
	]

	Array is sorted by created order, oldest first.
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

		var suite_id = query.suite_id;
		if (!suite_id)
		{
			self.emit ('done', 'Parameter missing: suite_id');
			return;
		}

		pg.connect (global.database, function (err, client, done)
		{
			client.query ('SELECT t.*, COALESCE(r.outcome,\'\') AS last_outcome FROM test t LEFT OUTER JOIN (SELECT DISTINCT ON (test_id) test_id, outcome FROM test_runs_inc_outcomes ORDER BY test_id DESC, id DESC) r ON r.test_id=t.id WHERE t.suite_id=$1 ORDER BY t.id DESC', [suite_id], function (err, result)
			{
				done ();

				if (err)
				{
					self.emit ('done', err.toString ());
					return;
				}

				answer.tests = [];
				for (var n in result.rows)
				{
					answer.tests.push (result.rows[n]);
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
