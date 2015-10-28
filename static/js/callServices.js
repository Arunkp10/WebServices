console.log("Call Services js Loaded !");
var callRefresh = function(){
	if(Id=="1"){
		console.log("Insert");
		$("#insert").show();
		$("#get").hide();
		$("#data").hide();
	} else if(Id=="2") {
		console.log("get");
		$("#insert").hide();
		$("#get").show();
		$("#data").show();
	} else if(Id == "3") {
		$("#insert").hide();
		$("#get").hide();
		$("#data").hide();
	}
};
var formatRow = function(status, message){
	var row = '<tr style="cursor: pointer"><td class="text-primary">' + status + '</td>' +
		'<td  class="text-primary">' + message + '</td></tr>';
		return row;
};
var formatDataRow = function(data){
	console.log("Formating data");
	var row = '<tr style="cursor: pointer">' +
		'<td class="text-primary">' + data.doctorid + '</td>' +
		'<td  class="text-primary">' + data.nurseid + '</td>' +
		'<td  class="text-primary">' + data.machineid + '</td>' +
		'<td  class="text-primary">' + data.patientid + '</td>' +
		'<td  class="text-primary">' + data.bloodpressure + '</td>' +
		'<td  class="text-primary">' + data.pulserate + '</td>' +
		'</tr>';
		return row;
}
$(document).ready(function(){
	$("#insertHealthData").unbind();
	$("#insertHealthData").bind("click", function(){
		console.log("insert Health Data triggered !");
		var docId = $("#docId").val();
		var nurId = $("#nurId").val();
		var patId = $("#patId").val();
		var macId = $("#macId").val();
		var bloodPres = $("#bloodPres").val();
		var pulseRate = $("#pulseRate").val();
		console.log(" DocId " + docId);
		console.log(" NurId " + nurId);
		console.log(" PatId " + patId);
		console.log(" MacId " + macId);
		console.log(" BP " + bloodPres);
		console.log(" Pulse Rate " + pulseRate);

		callServer ('insert_health_data', {
			doctorId: docId, 
			nurseId: nurId, 
			patientId: patId, 
			machineId: macId, 
			bloodPressure: bloodPres, 
			pulseRate:pulseRate}, 
			function (err, data){
			if (err)
				return;
			console.log("insert_health_data: " + JSON.stringify(data));
			var table = $('#tests-table > tbody');
			table.empty ();
			table.append(formatRow(data.result, data.message));
		});
	});

	$("#getHealthData").unbind();
	$("#getHealthData").bind("click", function(){
		console.log("get Health Data triggered !");
		var getPatId = $("#getPatientId").val();
		if(getPatId == ""){
			console.log("error : null parameter");
		}else{
			console.log("ok : call server api");
			callServer('get_health_data', {
				patientId: getPatId
			}, function(err, data){
				if(err)
					return;
				console.log("get_health_data : "+ JSON.stringify(data));
				var table1 = $('#tests-table > tbody');
				table1.empty ();
				table1.append(formatRow(data.result, data.message));
				var table2 = $('#data-table > tbody');
				table2.empty();
				for(var i in data.data){
					table2.append(formatDataRow(data.data[i]))
				};
			});
		}
	});
});
