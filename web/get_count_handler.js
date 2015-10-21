//get_description:

var events = require ('events');
var pg = require ('pg');

function Handler ()
{
	events.EventEmitter.call (this);

	this.handle = function (query, answer)
	{
		var self = this;

		var id = query.id;
		var status = query.status;
		console.log("ID : " + id);
		if (!id)
		{
			self.emit ('done', 'Parameter missing: suite_id');
			return;
		}

		pg.connect (global.database, function (err, client, done)
		{
			client.query ('SELECT severity FROM test_log WHERE target_id=$1 AND severity=$2', [id, status], function (err, result)
			{
				done ();

				if (err)
				{
					self.emit ('done', err.toString ());
					return;
				}
				answer.tests = [];
				console.log("RESULT : " + JSON.stringify(result));
				for (var n in result.rows)
				{
					answer.tests.push (result.rows[n]);
					console.log("Result : " + result.rows[n]);
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
