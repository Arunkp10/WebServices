/*********************************************************************************************/
$(document).ready(function()
{
	$('#suites-table > tbody').on('click', 'tr', function (e)
	{
		// var url = './suite?id=' + $(this).data('suite-id');
		if($(this).data('ws-id')==1 || $(this).data('ws-id')==2){
			var url = './callServices?id="' + $(this).data('ws-id') + '"';
			location.href = url;
		} else if($(this).data('ws-id')==3){
			var url = './displaySummary';
			location.href = url;
		}
		
	});
	var table = $('#suites-table > tbody');
	table.empty ();
	var webServices = [{
		"id":1,
		"name":"InsertHealthData"
	},{
		"id":2,
		"name":"GetHealthData"
	},{
		"id":3,
		"name":"DisplaySummary"
	}];
	for (var n in webServices){
		var row = formatSuiteRow (webServices[n]);
		row.data ('ws-id', webServices[n].id);
		table.append(row);
	}
});

/*********************************************************************************************/
function formatSuiteRow (suite)
{
	return $('<tr style="cursor: pointer">' +
		'<td class="text-primary">' + suite.name + '</td>' +
		'<td>' + '<input type="button" value="callService" onclick="" />' + '</td>' +
		'</tr>');
}
