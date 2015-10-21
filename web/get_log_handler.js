/*
Request parameters:
target_id: <required>
severity: <required, array of severity names>

Answer object:
{
	result: "ok",
	entries: <array of log entry objects>
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

		if (!query.target_id)
		{
			self.emit ('done', 'Parameter missing: target_id');
			return;
		}
		var target_id = query.target_id;

		// Severity field is missing if it is an empty array (because there is no way to send it through POST urlencoding?)
		// in which case set it to an empty array
		var severity = query.severity || [];
		if (severity.length == 0)
		{
			self.emit ('done', 'No severity specified');
			return;
		}

		pg.connect (global.database, function (err, client, done)
		{
			var clause = '';
			for (n = 1; n <= severity.length; n++)
				if (n == 1)
					clause = '($2';
				else
					clause += ',$' + (n + 1);
			clause += ')';

			var config = {text: 'SELECT * FROM test_log WHERE target_id=$1 AND severity IN ' + clause + ' ORDER BY id DESC'};
			config.values = [target_id];
			Array.prototype.push.apply (config.values, severity);

			client.query (config, function (err, result)
			{
				done ();

				if (err)
				{
					self.emit ('done', err.toString ());
					return;
				}

				answer.entries = [];
				for (var n in result.rows)
				{
					answer.entries.push (result.rows[n]);
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
