//get_health_data:

var events = require ('events');
var pg = require ('pg');

function Handler ()
{
	events.EventEmitter.call (this);

	this.handle = function (query, answer)
	{
		var self = this;
		var patientId = query.patientId;

		console.log("Query : " + JSON.stringify(query));
		
		if(!query.patientId){
			self.emit ('done', 'Parameter missing: patientId');
			return;
		} else{
			var currentTime = new Date().toUTCString();
			console.log("Current time : " + currentTime);
			pg.connect (global.database, function (err, client, done)
			{
				client.query ('SELECT doctorid, nurseid, patientid, machineid, bloodpressuremin, bloodpressuremax, pulserate, timestamp FROM healthdata WHERE patientid=$1', [patientId], function (err, result)
				{
					done ();

					if (err)
					{
						self.emit ('done', err.toString ());
						return;
					}

					if (result.rows.length > 0){
						answer.data = result.rows;
					}
					answer.message = "get successfull"
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
