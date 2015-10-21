/*
Request parameters:
id: sequence record id

Answer object:
{
	result: "ok",
}
*/

var events = require ('events');
var pg = require ('pg');
var vm = require ('vm');

function Handler ()
{
	events.EventEmitter.call (this);

	this.handle = function (query, answer)
	{
		var self = this;

		if (!query.id)
		{
			self.emit ('done', 'Parameter missing: id');
			return;
		}
		var sequence_id = parseInt (query.id);

		pg.connect (global.database, function (err, client, done)
		{
			client.query ('SELECT * FROM sequence WHERE id=$1', [sequence_id], function (err, result)
			{
				done ();

				if (err)
				{
					self.emit ('done', err.toString ());
					return;
				}

				if (result.rows.length == 0)
				{
					self.emit ('done', 'Sequence id ' + sequence_id + ' not found');
					return;
				}

				// Create the ats3 object which the running sequence can access
				var ats3 =
				{
					log: function (severity, entry)
					{
						var needle = require ('needle');
						needle.post (global.local_url, {operation: 'log_sequence', id: sequence_id, severity: severity, entry: entry}, {}, function (err, response)
						{
						});
					}
				};

				var sandbox = {ats3: ats3};

				// Add functions from our global object to the sandbox global, e.g. setTimeout, setInterval
				for (prop in global)
				{
					if (typeof global [prop] === 'function')
						sandbox [prop] = global [prop];
				}

				var code = result.rows[0].code;
				vm.runInNewContext (code, sandbox);
				ats3.log ('info', 'Sequence started');

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
