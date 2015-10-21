// Currently displayed run
var CurrentRun = null;

/*********************************************************************************************/
$(document).ready(function()
{
	var socket = io ();

	// The variable 'Id' holds the id of this run and is set when the page is rendered by the server.
	callServer ('get_run', {id: Id}, function (err, data)
	{
		if (err)
			return;

		CurrentRun = data.run;

		$('#run-name').text ('Run ' + CurrentRun.id);
		$('#run-description').html (CurrentRun.description || '&nbsp;');
		$('#run-submitted').text(new Date (CurrentRun.submitted).toLocaleString ());
		$('#run-record-id').text (CurrentRun.id);

		// Get parent test record in order to show test name
		callServer ('get_test', {id: CurrentRun.test_id}, function (err, data)
		{
			if (err) return;
			$('#test-name').text (data.test.name).attr('href','./test?id=' + data.test.id);
			
			// Similarly, get grand-parent suite record
			callServer ('get_suite', {id: data.test.suite_id}, function (err, data)
			{
				if (err) return;
				$('#suite-name').text (data.suite.name).attr('href','./suite?id=' + data.suite.id);
			});
		});

		// Get list of targets for this run and populate table
		callServer ('get_targets', {run_id: CurrentRun.id}, function (err, data)
		{
			var table = $('#targets-table > tbody');
			table.empty ();
			for (var n in data.targets)
			{
				var row = formatTargetRow (data.targets[n]);
				row.data ('target-id', data.targets[n].id);
				table.append(row);
			}
		});

		// Wait for connection then register for updates for this run
		socket.on ('connect', function ()
		{
			socket.emit ('register-run', CurrentRun.id);
		});

		// Update display when a target for this run is updated
		socket.on ('run-target', function (target)
		{
			// Find table row for this target, if any
			var row = $('#targets-table > tbody > tr').filter (function ()
			{
				return $(this).data ('target-id') == target.id;
			});
			if (row.length == 0)
				return;
			var new_row = formatTargetRow (target);
			new_row.data ('target-id', target.id);
			row.replaceWith (new_row);
		});
	});

	/************************************************************************************************************/
	$('#targets-table').on ('click', 'tbody > tr', function (e)
	{
		var target_id = $(this).data ('target-id');
		location.href = './target?id=' + target_id;
	});
});

/*********************************************************************************************/
function formatTargetRow (target)
{
	var row ='<tr style="cursor: pointer">';
	row += '<td>' + target.target + '</td><td>' + capitaliseFirstLetter (target.status) + '</td>';

	if (target.outcome == 'pass')
		var outcome_class = 'label-success';
	else
		var outcome_class = 'label-danger';

	row += '<td><span class="label ' + outcome_class + '">' + capitaliseFirstLetter (target.outcome) + '</span></td>';

	if (target.agent_name)
		row += '<td>' + target.agent_name + '</td>';
	else
		row += '<td></td>';

	row += '</tr>';

	return $(row);
}
