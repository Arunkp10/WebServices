/*
Request parameters:
resource_id: <required>
<All other fields are optional and will be updated where present

Answer object:
{
	result: "ok",
	resource: <modifed resource>
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

		if (!query.resource_id)
		{
			self.emit ('done', 'Parameter missing: resource_id');
			return;
		}
		var resource_id = parseInt (query.resource_id);

		pg.connect (global.database, function (err, client, done)
		{
			client.query ('SELECT * FROM test_resource WHERE id=$1', [resource_id], function (err, result)
			{
				if (err)
				{
					done ();
					self.emit ('done', err.toString ());
					return;
				}

				if (result.rows.length == 0)
				{
					done ();
					self.emit ('done', 'Resource id ' + resource_id + ' not found');
					return;
				}

				var resource = result.rows[0];

				// Update those fields specified in query
				switch (resource.type)
				{
				case 'github':
					if (query.repository) resource.definition.repository = query.repository;
					if (query.owner) resource.definition.owner = query.owner;
					if (query.path) resource.definition.path = query.path;
					break;

				case 's3':
					if (query.bucket) resource.definition.bucket = query.bucket;
					if (query.path) resource.definition.path = query.path;
					break;

				case 'url':
					if (query.path) resource.definition.path = query.path;
					break;
				}

				// Write new values to database
				client.query ('UPDATE test_resource SET name=COALESCE($1,name), definition=$2 WHERE id=$3 RETURNING *', [query.name, resource.definition, resource_id], function (err, result)
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
