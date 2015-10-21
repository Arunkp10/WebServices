/*
Request parameters:
name: name of new test
suite_id: id of suite to which this test belongs

Answer object:
{
	result: "ok",
	test: <new test object>
}
*/

var events = require ('events');
var pg = require ('pg');
var fs = require ('fs');

function Handler ()
{
	events.EventEmitter.call (this);

	this.handle = function (query, answer)
	{
		var self = this;

		var suite_id = parseInt (query.suite_id);
		if (!suite_id)
		{
			self.emit ('done', 'Parameter missing: suite_id');
			return;
		}

		var name = query.name;
		if (!name)
		{
			self.emit ('done', 'Parameter missing: name');
			return;
		}

		var description = query.description || '';

		pg.connect (global.database, function (err, client, done)
		{
			// Create record in database - directory name will be updated later
			client.query ('INSERT INTO test (name, suite_id, description) VALUES ($1, $2, $3) RETURNING *', [name, suite_id, description], function (err, result)
			{
				if (err)
				{
					done ();
					self.emit ('done', err.toString ());
					return;
				}

				var test = result.rows[0];

				// Create unique directory for storing the test files
				// Blocking function 'cos it's easier, doesn't take long to run and is rarely used!
				var root = './test_files/test_' + test.id;
				var dir = root;
				var suffix = 1;
				while (true)
				{
					try
					{
						fs.mkdirSync (dir);
						break;
					}
					catch (err)
					{
						if (err.code == 'EEXIST')
						{
							dir = root + '_' + suffix++;
						}
						else
						{
							self.emit ('done', 'Cannot create: ' + err.path);
							return;
						}
					}
				}

				// Update new test record with directory
				client.query ('UPDATE test SET directory=$1 WHERE id=$2', [dir, test.id], function (err, result)
				{
					done ();

					if (err)
					{
						self.emit ('done', err.toString ());
						return;
					}

					answer.test = test;
					self.emit ('done', null, answer);
				});
			});
		});
	};
};

Handler.prototype = Object.create (events.EventEmitter.prototype);

exports.createHandler = function()
{
	return new Handler();
};
