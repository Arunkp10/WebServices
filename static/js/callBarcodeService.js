console.log("Call Barcode Services js Loaded !");
var callRefresh = function(){
	if(Id=="4"){
		console.log("API1");
		$("#insert").show();
		$("#get").hide();
		$("#data").hide();
	} else if(Id=="5") {
		console.log("API2");
		$("#insert").hide();
		$("#get").show();
		$("#data").show();
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
		'<td  class="text-primary">' + data.bloodpressuremin + '</td>' +
		'<td  class="text-primary">' + data.bloodpressuremax + '</td>' +
		'<td  class="text-primary">' + data.pulserate + '</td>' +
		'</tr>';
		return row;
}
$(document).ready(function(){
	$("#callBarcodeService1").unbind();
	$("#callBarcodeService1").bind("click", function(){
		console.log("insert Health Data triggered !");
		callServer ('insert_barcode_data', {
			barcode:"barcodeData"}, 
			function (err, data){
			if (err)
				return;
			console.log("insert_barcode_data: " + JSON.stringify(data));
			var table = $('#tests-table > tbody');
			table.empty ();
			table.append(formatRow(data.result, data.message));
		});
	});

	$("#callBarcodeService2").unbind();
	$("#callBarcodeService2").bind("click", function(){
		console.log("get Health Data triggered !");
	});
});
