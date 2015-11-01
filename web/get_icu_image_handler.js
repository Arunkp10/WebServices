//get_health_data:

var events = require ('events');
var pg = require ('pg');
var nconf = require('nconf');
nconf.argv ();
nconf.env ();
nconf.file ({file: './config.json'});

function Handler ()
{
	events.EventEmitter.call (this);

	this.handle = function (query, answer)
	{
		var self = this;
		var patientId = query.patientId;
		var recId = query.recId;

		console.log("Query : " + JSON.stringify(query));
		
		if(!query.patientId || !query.recId){
			self.emit ('done', 'Parameter missing: patientId or recId');
			return;
		} else{
			var currentTime = new Date().toUTCString();
			console.log("Current time : " + currentTime);
			pg.connect (global.database, function (err, client, done)
			{
				client.query ('SELECT image FROM healthdata WHERE recordid=$1 AND patientid=$2', [recId, patientId], function (err, result)
				{
					done ();

					if (err)
					{
						self.emit ('done', err.toString ());
						return;
					}

					if (result.rows.length > 0){
						var path = "http://"+nconf.get('server_ip') + ":"+ nconf.get('server_port') + "/" + result.rows[0].image;
						console.log("Image path : " + path);
						answer.path = path;
					}
					answer.message = "get successfull";
					self.emit ('done', null, answer);
				});	
			});
		}
	};
};

Handler.prototype = Object.create (events.EventEmitter.prototype);

exports.createHandler = function()
{
	return new Handler();
};
