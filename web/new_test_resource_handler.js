/*
Request parameters:
test_id: <required>
type: <github or s3 or url>
name: <optional, name for resource, defaults to blank>
Other fields depending on type:
github:
	repository: <required>
	owner: <required>
	path: <required>

s3:
	bucket: <required>
	path: <required>

url:
	path: <required>

Answer object:
{
	result: "ok",
	resource: <new resource object>
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

		if (!query.type)
		{
			self.emit ('done', 'Parameter missing: type');
			return;
		}
		var type = query.type;

		var name = query.name || '';

		// Build definition according to type
		var definition = {};

		switch (type)
		{
		case 'github':
			if (!query.repository)
			{
				self.emit ('done', 'Parameter missing: repository');
				return;
			}
			definition.repository = query.repository;

			if (!query.owner)
			{
				self.emit ('done', 'Parameter missing: owner');
				return;
			}
			definition.owner = query.owner;

			if (!query.path)
			{
				self.emit ('done', 'Parameter missing: path');
				return;
			}
			definition.path = query.path;

			break;

		case 's3':
			if (!query.bucket)
			{
				self.emit ('done', 'Parameter missing: bucket');
				return;
			}
			definition.bucket = query.bucket;

			if (!query.path)
			{
				self.emit ('done', 'Parameter missing: path');
				return;
			}
			definition.path = query.path;

			break;

		case 'url':
			if (!query.path)
			{
				self.emit ('done', 'Parameter missing: path');
				return;
			}
			definition.path = query.path;

			break;

		default:
			self.emit ('done', 'Unknown type: ' + type);
			break;
		}
			
		pg.connect (global.database, function (err, client, done)
		{
			// Insert a new record into table, with definition as JSON object
			client.query ('INSERT INTO test_resource (test_id, type, definition, name) VALUES ($1, $2, $3, $4) RETURNING *', [test_id, type, definition, name], function (err, result)
			{
				done ();

				if (err)
				{
					self.emit ('done', err.toString ());
					return;
				}

				answer.resource = result.rows[0];
				unpack_resource (answer.resource);
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
