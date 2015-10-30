//get_description:
var nconf = require('nconf');
var events = require ('events');
var pg = require ('pg');
// Load configuration values
nconf.argv ();
nconf.env ();
nconf.file ({file: './config.json'});

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
		var bloodPressureMin = parseInt(query.bloodPressureMin);
		var bloodPressureMax = parseInt(query.bloodPressureMax);
		var pulseRate = parseInt(query.pulseRate);
		var blobData = query.blobData;
		var currentTime = new Date().toUTCString();
		var recordId = "Rec_" + new Date();
		var outOfRange = false;
		console.log("Query : " + JSON.stringify(query));


		if(bloodPressureMin > nconf.get('diastolicMaxRange') || bloodPressureMin < nconf.get('diastolicMinRange')){
			console.log("OUT OF RANGE !!! ");
			diastolicOutOfRange = true;

		}
		if(bloodPressureMax > nconf.get('systolicMaxRange') || bloodPressureMax < nconf.get('systolicMinRange')){
			console.log("OUT OF RANGE !!! ");
			systolicOutOfRange = true;
		}
		if(systolicOutOfRange || diastolicOutOfRange){
			console.log("Push service Call !");
			outOfRange = true;
		}

		
		if(!query.doctorId || !query.nurseId || !query.patientId || !query.machineId || !query.bloodPressureMin || !query.bloodPressureMax || !query.pulseRate){
			self.emit ('done', 'Parameter missing: patientId');
			return;
		} else{
			//console.log("pg date : " + pg.to_timestamp(currentTime, "DD Mon YYY HH MI SS"));
			pg.connect (global.database, function (err, client, done)
			{
				client.query ('INSERT INTO healthdata (recordid, doctorid, nurseid, patientid, machineid, bloodpressuremin, bloodpressuremax, pulserate, timestamp, image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [recordId, doctorId, nurseId, patientId, machineId, bloodPressureMin, bloodPressureMax, pulseRate, new Date(), recordId], function (err, result)
				{
					done ();
					if (err)
					{
						self.emit ('done', err.toString ());
						return;
					}
					answer.message = "Insert successfull"
					answer.recordid = recordId;
					answer.outOfRange = outOfRange;
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
