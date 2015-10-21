var myTrClick = function(id){
		var url = './target?id=' + id;
		location.href = url;
	};
$(document).ready(function(){
	
	console.log("summary js : Loaded with suiteId : " + Id);
	$('#summaryHeading').text(des + " Summary : ");
	
	var testArry = [];
	var testData = {};
	testData.name = '';
	testData.suite_id = Id;
	testData.buildVersion = des;
	testData.id = '';
	testData.targets = [];

	var targetArry =[];
	var targetData = {};
	targetData.target_id = '';
	targetData.target_name = '';
	targetData.total_pass = '';
	targetData.total_fail = '';


	callServer ('get_summary', {id: Id, des: des}, function (err, data1) {
		if(err)
			return;
		console.log("Summary Data1 : " + JSON.stringify(data1));
		summaryData = data1;

		for(var n in summaryData.tests){
			testData.id = summaryData.tests[n].id;
			testData.test_id = summaryData.tests[n].test_id;
			console.log("summary js : " + JSON.stringify(summaryData.tests[n]));
			callServer('get_testName', {id:summaryData.tests[n].test_id}, function (err, data2){
				if(err)
					return;
				testData.name = data2.tests[0].name;
				
			});
			callServer('get_targetData', {id:summaryData.tests[n].id}, function (err, data3){
				if(err)
					return;
				console.log("target Data : " + JSON.stringify(data3));
				for(var t in data3.tests){
					targetData.target_id = data3.tests[t].id;
					targetData.target_name = data3.tests[t].target;
					callServer('get_count', {id:data3.tests[t].id, status:'info'}, function (err, data4){
						if(err)
							return;
						console.log("data 4 : " + data3.tests[t].id + " : " + JSON.stringify(data4));
						targetData.total_pass = data4.tests.length;
						callServer('get_count', {id:data3.tests[t].id, status:'error'}, function (err, data5){
							if(err)
								return;
							console.log("data 5 : " + targetData.target_id + " : " + data3.tests[t].id + " : " + JSON.stringify(data5));
							targetData.total_fail = data5.tests.length;
							targetArry.push(targetData);
							testData.targets.push(targetData);
							console.log("Test-Array : " + JSON.stringify(testArry))
							var table = $('#tests-table > tbody');
							table.empty ();
							for (var n in testArry){
								var row = formatTestRow (testArry[n]);
								row.data ('target-id', testArry[n].id);
								table.append(row);
							}
							var myData = new Array(['Pass', targetData.total_pass], ['Fail', targetData.total_fail]);
							console.log("Graph Data : " + JSON.stringify(myData));
							var colors = ['#009900', '#FF0000'];
							var myChart = new JSChart('graph', 'pie');
							myChart.setDataArray(myData);
							myChart.colorizePie(colors);
							myChart.setTitleColor('#857D7D');
							myChart.setPieUnitsColor('#9B9B9B');
							myChart.setPieValuesColor('#6A0000');
							myChart.draw();
							$('#passCount').text(targetData.total_pass);
							$('#failCount').text(targetData.total_fail);
							$('#totalCount').text(parseInt(targetData.total_pass)+parseInt(targetData.total_fail));
							callServer('get_suite', {id: Id}, function (err, data){
								if(err)
									return;
								console.log("Suite data : " + JSON.stringify(data));
								var currentSuite = data.suite;
								$('#heading').text(currentSuite.name + " - " + des);
								$('#graph > div').css({position:'absolute'});

							});
						});
					});
				}
				testArry.push(testData);
			});
			
		}
	});

	// get suite details:
	

	function formatTestRow (test){
		var targets = '';
		var targetsCount = test.targets.length;
		console.log("Targets Count : "+targetsCount);
		var spaning = targetsCount + 1;
		
		if(targetsCount>1){
			var i;
			for(i=0; i < parseInt(targetsCount); i++){
				console.log("i : " + i);
				if(i==0){
					targets = targets + '<td>' + test.targets[i].target_name + '</td><td><span class="label label-success">' + test.targets[i].total_pass + '</span></td><td><span class="label label-danger">' + test.targets[i].total_fail + '</span></td></tr>';
				} else {
					targets = targets + '<tr id="' + test.targets[i].target_id + '" onclick="myTrClick(' + test.targets[i].target_id + ')"><td>' + test.targets[i].target_name + '</td><td><span class="label label-success">' + test.targets[i].total_pass + '</span></td><td><span class="label label-danger">' + test.targets[i].total_fail + '</span></td></tr>';		
				}
			}
			var row = '<tr onclick="myTrClick('+ test.targets[0].target_id+')"><td rowspan="' + targetsCount + '">' + test.name + '</td>' + '<td rowspan="'+  targetsCount +'">' + test.buildVersion + '</td>' + targets;
		} else {
			targets = targets + '<td>' + test.targets[0].target_name + '</td><td><span class="label label-success">' + test.targets[0].total_pass + '</span></td><td><span class="label label-danger">' + test.targets[0].total_fail + '</span></td></tr>';
			var row = '<tr onclick="myTrClick('+ test.targets[0].target_id+')"><td>' + test.name + '</td>' + '<td>' + test.buildVersion + '</td>' + targets;
		}
		return $(row);
	}
});