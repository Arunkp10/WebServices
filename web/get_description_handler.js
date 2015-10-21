//get_description:

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
			client.query ('select description from test_run where test_id in (select id from test where suite_id=$1) group by (description) order by (description);', [suite_id], function (err, result)
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
