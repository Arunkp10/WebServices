//get_description:

var events = require ('events');
var pg = require ('pg');

function Handler ()
{
	events.EventEmitter.call (this);

	this.handle = function (query, answer)
	{
		var self = this;
		var doctorId = query.doctorId;
		var nurseId = query.nurseId;
		var patientId = query.patientId;
		var machineId = query.machineId;
		var bloodPressure = query.bloodPressure;
		var pulseRate = query.pulseRate;

		console.log("Query : " + JSON.stringify(query));

		
		if(!query.doctorId || !query.nurseId || !query.patientId || !query.machineId || !query.bloodPressure || !query.pulseRate){
			self.emit ('done', 'Parameter missing: suite_id');
			return;
		} else{
			var currentTime = new Date().toUTCString();
			console.log("Current time : " + currentTime);
			//console.log("pg date : " + pg.to_timestamp(currentTime, "DD Mon YYY HH MI SS"));
			pg.connect (global.database, function (err, client, done)
			{
				client.query ('INSERT INTO healthdata (doctorid, nurseid, patientid, machineid, bloodpressure, pulserate, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7)', [doctorId, nurseId, patientId, machineId, bloodPressure, pulseRate, new Date()], function (err, result)
				{
					done ();
					if (err)
					{
						self.emit ('done', err.toString ());
						return;
					}
					answer.message = "Insert successfull"
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
