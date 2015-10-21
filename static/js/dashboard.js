/*********************************************************************************************/
$(document).ready(function()
{
	loadTests ();
});

/*********************************************************************************************/
function formatTestRow (test)
{
	/*if (gem.result == 'success')
		var result = '<span class="label label-success">success</span>&emsp;<span class="text-success">Installed successfully</span>';
	else
		var result = '<span class="label label-danger">error</span>&emsp;<span class="text-danger">' + gem.result + '</span>';*/

	return $('<tr><td><a href="./test?test_id=' + test.id + '">' + test.name + '</a></td>' +
		'<td>' + test.status + '</td></tr>');
}

/*********************************************************************************************/
function loadTests ()
{
	$.ajax(
	{
		url: './interface',
		type: 'POST',
		data: {operation: 'get_tests'},
		dataType: 'json',
		success: function(response)
		{
			if (response.result == 'error')
			{
				console.error(response.message);
				return;
			}

			var table = $('#tests-table > tbody');
			table.empty ();
			for (var n in response.tests)
			{
				var row = formatTestRow (response.tests[n]);
				table.append(row);
			}

			/*$('td > a').click(function (e)
			{
				alert (e.target.dataset.id);
			});*/
		},
		error: function(xhr, status, error)
		{
			alert('Error in loadTests(): ' + error);
		}
	});
}
