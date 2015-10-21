//get_description:

var events = require ('events');
var pg = require ('pg');

function Handler ()
{
	events.EventEmitter.call (this);

	this.handle = function (query, answer)
	{
		var self = this;

		var suite_id = query.id;
		var des = query.des;
		if (!suite_id)
		{
			self.emit ('done', 'Parameter missing: suite_id');
			return;
		}

		var summaryResult = {};

		pg.connect (global.database, function (err, client, done)
		{
			client.query ('select id, test_id from test_run where description=$1', [des], function (err, result)
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
		

		// pg.connect (global.database, function (err, client, done)
		// {
		// 	client.query ('select name, test_id from test where test_id in (select id, test_id from test_run where description=$1)', [des], function (err, result)
		// 	{
		// 		done ();

		// 		if (err)
		// 		{
		// 			self.emit ('done', err.toString ());
		// 			return;
		// 		}

		// 		answer.tests = [];
		// 		for (var n in result.rows)
		// 		{
		// 			answer.tests.push (result.rows[n]);
		// 		}
		// 		self.emit ('done', null, answer);
		// 	});
		// });
	};
};

Handler.prototype = Object.create (events.EventEmitter.prototype);

exports.createHandler = function()
{
	return new Handler();
};
