/*
Request parameters:
test_id: test id

Answer object:
{
	result: "ok",
	resources: <array of resource objects>
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

		if (!query.test_id)
		{
			self.emit ('done', 'Parameter missing: test_id');
			return;
		}
		var test_id = parseInt (query.test_id);

		pg.connect (global.database, function (err, client, done)
		{
			client.query ('SELECT * FROM test_resource WHERE test_id=$1 ORDER BY id DESC', [test_id], function (err, result)
			{
				done ();

				if (err)
				{
					self.emit ('done', err.toString ());
					return;
				}

				answer.resources = [];
				for (var n in result.rows)
				{
					answer.resources.push (result.rows[n]);
					unpack_resource (answer.resources[n]);
				}

				self.emit ('done', null, answer);
			});
		});
	};
};

function unpack_resource (resource)
{
	Object.keys (resource.definition).forEach (function (key)
	{
		resource[key] = resource.definition[key];
	});
}

Handler.prototype = Object.create (events.EventEmitter.prototype);

exports.createHandler = function()
{
	return new Handler();
};
