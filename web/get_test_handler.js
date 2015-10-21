/*
Request parameters:
id: test record id

Answer object:
{
	result: "ok",
	test: <test object>
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
			client.query ('SELECT t.*, COALESCE(r.outcome,\'\') AS last_outcome FROM test t LEFT OUTER JOIN (SELECT test_id, outcome FROM test_runs_inc_outcomes WHERE test_id=$1 ORDER BY id DESC LIMIT 1) r ON r.test_id=t.id WHERE t.id=$1', [id], function (err, result)
			{
				done ();

				if (err)
				{
					self.emit ('done', err.toString ());
					return;
				}

				if (result.rows.length == 0)
				{
					self.emit ('done', 'Test id ' + id + ' not found');
					return;
				}

				answer.test = result.rows[0];

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
