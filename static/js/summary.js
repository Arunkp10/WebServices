var myTrClick = function (id) {
		var url = './target?id=' + id;
		location.href = url;
	};
localStorage.totalPass = 0;
localStorage.totalFail = 0;
$(document).ready(function(){
	
	console.log("summary js : Loaded with suiteId : " + Id);
	$('#summaryHeading').text("Summary : " + des);
	
	var summaryTests = [];
	callServer ('get_summary', {id: Id, des: des}, function (err, data1) {
		if(err)
			return;
		console.log("Data1 : " + JSON.stringify(data1));
		summaryData = data1;
		var table = $('#tests-table > tbody');
		table.empty ();
		var row = "";
		for(var n in summaryData.tests){
			summaryTests.push(summaryData.tests[n]);
			row = row + "<tr id=" + summaryData.tests[n].test_id + "></tr>";
		}
		table.append(row);
		for(var n in summaryTests){
			(function(n, summaryTests){
				console.log("Loop : " + n + " Test Id : " + summaryTests[n].test_id);
				callServer('get_testName', {id:summaryTests[n].test_id, test_id:summaryData.tests[n].test_id}, function (err, data2){
					if(err)
						return;
					var pushData = data2.tests[0].name;
					var id = "#" + summaryTests[n].test_id;
					$(id).html("<td id='" + summaryTests[n].test_id + "_name' " + ">" + data2.tests[0].name + "</td><td id='" + summaryTests[n].test_id + "_des' " + ">"+ des +"</td>");
				});
			})(n, summaryTests);
		}
		function AddTrBefore(rowId){
		    var target = document.getElementById(rowId);
		    var newElement = document.createElement('tr');
		    target.parentNode.insertBefore(newElement, target);
		    return newElement;
		}
		function AddTrAfter(rowId){
		    var target = document.getElementById(rowId);
		    var newElement = document.createElement('tr');
		    target.parentNode.insertBefore(newElement, target.nextSibling);
		    return newElement;
		}
		function AddBefore(rowId){
		    var target = document.getElementById(rowId);
		    var newElement = document.createElement('td');
		    target.parentNode.insertBefore(newElement, target);
		    return newElement;
		}
		function AddAfter(rowId, id){
		    var target = document.getElementById(rowId);
		    var newElement = document.createElement('td');
		    newElement.id = id;
		    target.parentNode.insertBefore(newElement, target.nextSibling);
		    return newElement;
		}
		
		for(var n in summaryTests){
			var totalPass = 0;
			var totalFail = 0;
			var grandTotal = 0;
			(function(n, summaryTests){
				callServer('get_targetData', {id:summaryData.tests[n].id, test_id:summaryData.tests[n].test_id}, function (err, data3){
					if(err)
						return;
					console.log("target Data : " + JSON.stringify(data3));
					var id = "#" + data3.test_id;
					console.log("ID : " + id);
					if(data3.tests.length == 1){
						console.log("TargetName : " + data3.tests[0].target);
						$(id).append("<td id='" + data3.test_id + "_device' onclick='myTrClick(" + data3.tests[0].id + ")' >" + data3.tests[0].target + "</td>");
						callServer('get_count', {id:data3.tests[0].id, status:'info'}, function (err, data4){
							if(err)
								return;
							console.log("Data4 : " + JSON.stringify(data4));
							totalPass = localStorage.totalPass;
							totalPass = parseInt(totalPass);
							totalPass = totalPass + data4.tests.length;
							localStorage.totalPass = totalPass;
							$(id).append("<td><span class='label label-success'>" + data4.tests.length + "</span></td>");
						});
						callServer('get_count', {id:data3.tests[0].id, status:'error'}, function (err, data4){
							if(err)
								return;
							console.log("Data4 : " + JSON.stringify(data4));
							totalFail = localStorage.totalFail;
							totalFail = parseInt(totalFail);
							totalFail = totalFail + data4.tests.length;
							localStorage.totalFail = totalFail;
							$(id).append("<td><span class='label label-danger'>" + data4.tests.length + "</span></td>");
							var myData = new Array(['Pass', parseInt(totalPass)], ['Fail', parseInt(totalFail)]);
							console.log("Graph Data : " + JSON.stringify(myData));
							var colors = ['#009900', '#FF0000'];
							var myChart = new JSChart('graph', 'pie');
							myChart.setDataArray(myData);
							myChart.colorizePie(colors);
							myChart.setTitleColor('#857D7D');
							myChart.setPieUnitsColor('#9B9B9B');
							myChart.setPieValuesColor('#6A0000');
							myChart.draw();
							$('#passCount').text(localStorage.totalPass);
							$('#failCount').text(localStorage.totalFail);
							grandTotal = totalPass + totalFail;
							$('#totalCount').text(grandTotal);
							callServer('get_suite', {id: Id}, function (err, data){
								if(err)
									return;
								console.log("Suite data : " + JSON.stringify(data));
								var currentSuite = data.suite;
								$('#heading').text(currentSuite.name + " - " + des);
								$('#graph > div').css({position:'absolute'});
							});
						});
					} else if(data3.tests.length > 1) {
						var spanning = data3.tests.length+1;
						var nameid = id + "_name";
						var desid = id + "_des";
						var deviceid = id + "_device";
						$(nameid).attr('rowspan', spanning);
						$(desid).attr('rowspan', spanning);
						$(deviceid).attr('rowspan', spanning);
						for(var t in data3.tests){
							(function(t, id){
								console.log("ID : " + t  + " : " + id);
								var b = AddTrAfter(data3.test_id);
								b.innerHTML =("<td id='" + data3.tests[t].id + "_device' onclick='myTrClick(" + data3.tests[t].id + ")' >" + data3.tests[t].target + "</td>");
								callServer('get_count', {id:data3.tests[t].id, status:'info'}, function (err, data4){
									if(err)
										return;
									console.log("Data4 : " + JSON.stringify(data4) + " : " + data3.test_id);
									var deviceId = data3.tests[t].id + "_device";
									var passId = data3.tests[t].id+"_pass";
									var c = AddAfter(deviceId, passId);
									c.innerHTML = ("<span class='label label-success'>" + data4.tests.length + "</span>");
									if(data4.tests.length == 0){
										totalPass = localStorage.totalPass;
										totalPass = parseInt(totalPass);
										totalPass = totalPass + data4.tests.length;
										localStorage.totalPass = totalPass;
									} else {
										totalPass = localStorage.totalPass;
										totalPass = parseInt(totalPass);
										totalPass = totalPass + data4.tests.length;
										localStorage.totalPass = totalPass;
									}
									
								});
								callServer('get_count', {id:data3.tests[t].id, status:'error'}, function (err, data4){
									if(err)
										return;
									console.log("Data4 : " + JSON.stringify(data4) + " : " + data3.test_id);
									var deviceId = data3.tests[t].id + "_pass";
									var failId = data3.tests[t].id + "_fail";
									if(data4.tests.length==0){
										totalFail = localStorage.totalFail;
										totalFail = parseInt(totalFail);
										totalFail = totalFail + data4.tests.length;
										localStorage.totalFail = totalFail;
									} else {
										ltotalFail = localStorage.totalFail;
										totalFail = parseInt(totalFail);
										totalFail = totalFail + data4.tests.length;
										localStorage.totalFail = totalFail;
									}
									
									console.log("Getcount : " + deviceId);
									console.log("Total Pass : " + localStorage.totalPass);
									console.log("Total Fail : " + localStorage.totalFail);
									var TotalPass = localStorage.totalPass;
									var TotalFail = localStorage.totalFail;
									var GrandTotal = parseInt(TotalPass) + parseInt(TotalFail);
									var d = AddAfter(deviceId, failId);
									d.innerHTML = ("<span class='label label-danger'>" + data4.tests.length + "</span>");
									$('#passCount').text(TotalPass);
									$('#failCount').text(TotalFail);
									$('#totalCount').text(GrandTotal);
									var myData = new Array(['Pass', parseInt(TotalPass)], ['Fail', parseInt(TotalFail)]);
									console.log("Graph Data : " + JSON.stringify(myData));
									var colors = ['#009900', '#FF0000'];
									var myChart = new JSChart('graph', 'pie');
									myChart.setDataArray(myData);
									myChart.colorizePie(colors);
									myChart.setTitleColor('#857D7D');
									myChart.setPieUnitsColor('#9B9B9B');
									myChart.setPieValuesColor('#6A0000');
									myChart.draw();
									callServer('get_suite', {id: Id}, function (err, data){
										if(err)
											return;
										console.log("Suite data : " + JSON.stringify(data));
										var currentSuite = data.suite;
										$('#heading').text(currentSuite.name + " - " + des);
										$('#graph > div').css({position:'absolute'});
									});
								});
							})(t, id);
						}

					} else if(data3.tests.length < 1) {
						$(id).append("<td>" + "No Records found" + "</td>");
					}
				});
			})(n, summaryTests);
		}
	});
});