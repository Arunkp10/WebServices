//get_description:
var exec = require('child_process').exec;
var events = require ('events');
var pg = require ('pg');

function Handler ()
{
	events.EventEmitter.call (this);

	this.handle = function (query, answer)
	{
		var self = this;
		console.log("Query : " + JSON.stringify(query));

		
		if(!query.barcode){
			self.emit ('done', 'Parameter missing: barcode');
			return;
		} else{
			var currentTime = new Date().toUTCString();
			console.log("Current time : " + currentTime);
			/*pg.connect (global.database, function (err, client, done)
			{
				client.query ('INSERT INTO healthdata (doctorid, nurseid, patientid, machineid, bloodpressuremin, bloodpressuremax, pulserate, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [doctorId, nurseId, patientId, machineId, bloodPressureMin, bloodPressureMax, pulseRate, new Date()], function (err, result)
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
			});*/
			function puts(error, stdout, stderr) { sys.puts(stdout) }
			exec("ls -la", function(error, stdout, stderr){
			  if (!error) {
			    // things worked!
			    console.log("Worked !");
			    console.log("output" + stdout);
			    answer.message = "command execution success !";
			    self.emit ('done', null, answer);
			  } else {
			    // things failed :(
			    console.log("Didnot worked!");
			    self.emit ('done', error.toString ());
				return;
			  }
			});
		}
	};
};

Handler.prototype = Object.create (events.EventEmitter.prototype);

exports.createHandler = function()
{
	return new Handler();
};
