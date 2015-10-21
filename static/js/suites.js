/*********************************************************************************************/
$(document).ready(function()
{
	$('#suites-table > tbody').on('click', 'tr', function (e)
	{
		var url = './suite?id=' + $(this).data('suite-id');
		location.href = url;
	});

	callServer ('get_suites', {}, function (err, data)
	{
		if (err)
			return;

		var table = $('#suites-table > tbody');
		table.empty ();
		for (var n in data.suites)
		{
			var row = formatSuiteRow (data.suites[n]);
			row.data ('suite-id', data.suites[n].id);
			table.append(row);
		}
	});
});

/*********************************************************************************************/
function formatSuiteRow (suite)
{
	return $('<tr style="cursor: pointer">' +
		'<td class="text-primary">' + suite.name + '</td>' +
		'<td>' + suite.test_count + '</td>' +
		'</tr>');
}
