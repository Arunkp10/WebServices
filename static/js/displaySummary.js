$(document).ready(function(){
	console.log("display Summary js loaded!");
	var myData = [];
	var myData2 = [];
	var formatRow = function(status, message){
	var row = '<tr style="cursor: pointer"><td class="text-primary">' + status + '</td>' +
		'<td  class="text-primary">' + message + '</td></tr>';
		return row;
	};
	var formatDataRow = function(data){
		console.log("Formating data" + JSON.stringify(data));
		var row = '<tr style="cursor: pointer">' +
			'<td class="text-primary">' + data.doctorid + '</td>' +
			'<td  class="text-primary">' + data.nurseid + '</td>' +
			'<td  class="text-primary">' + data.machineid + '</td>' +
			'<td  class="text-primary">' + data.patientid + '</td>' +
			'<td  class="text-primary">' + data.bloodpressure + '</td>' +
			'<td  class="text-primary">' + data.pulserate + '</td>' +
			'</tr>';
			var xDate = new Date(data.timestamp);
			var hour = xDate.getHours();
			var minute = xDate.getMinutes();
			var second = xDate.getSeconds();
			var timeSt = hour + ":" + minute + ":" + second;
			var newArr = [timeSt, data.bloodpressure];
			var newArr2 = [timeSt, data.pulserate];
			myData.push(newArr);
			myData2.push(newArr2);
			return row;
	};

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
					table2.append(formatDataRow(data.data[i]));
				};
				var tempData = [['2.0', 120], ['2.15', 122], ['2.30', 180], ['2.45', 150], ['3.0', 120], ['3.15', 100],['2.0', 120], ['2.15', 122], ['2.30', 180], ['2.45', 150], ['3.0', 120], ['3.15', 100],['2.0', 120], ['2.15', 122], ['2.30', 180], ['2.45', 150], ['3.0', 120], ['3.15', 100]];
				console.log(JSON.stringify(myData));
				var myChart = new JSChart('graph', 'line');
				myChart.setDataArray(myData, "line_1");
				myChart.setLineColor('#8D9386', "line_1");
				myChart.setDataArray(myData2, "line_2");
				myChart.setLineColor('#FF0000', "line_2");
				myChart.setLineWidth(4);
				myChart.setTitleColor('#7D7D7D');
				myChart.setAxisColor('#9F0505');
				myChart.setGridColor('#a4a4a4');
				myChart.setAxisValuesColorY('#333639');
				myChart.setAxisNameColor('#333639');
				myChart.setTextPaddingLeft(0);
				myChart.resize(900, 300);
				myChart.setAxisNameY("Blood pressure");
				myChart.setAxisNameX("TimeLine");
				myChart.setTitle("Blood Pressure & Pulse Rate Monitor");
				myChart.draw();
				
			});
		}
	});
});