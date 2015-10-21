// Currently displayed target
var CurrentTarget = null;

/*********************************************************************************************/
$(document).ready(function()
{
	var socket = io ();

	// The variable 'Id' holds the id of this target and is set when the page is rendered by the server.
	callServer ('get_target', {id: Id}, function (err, data)
	{
		if (err)
			return;

		CurrentTarget = data.target;
		showDetails ();

		// Get ancestor records in order to show breadcrumbs
		callServer ('get_run', {id: CurrentTarget.run_id}, function (err, data)
		{
			if (err) return;
			$('#run-name').text ('Run ' + data.run.id).attr('href','./run?id=' + data.run.id);

			callServer ('get_test', {id: data.run.test_id}, function (err, data)
			{
				if (err) return;
				$('#test-name').text (data.test.name).attr('href','./test?id=' + data.test.id);
				
				callServer ('get_suite', {id: data.test.suite_id}, function (err, data)
				{
					if (err) return;
					$('#suite-name').text (data.suite.name).attr('href','./suite?id=' + data.suite.id);
				});
			});
		});

		fillLogTable ();

		// Wait for connection then register for updates for this target
		socket.on ('connect', function ()
		{
			socket.emit ('register-target', CurrentTarget.id);
		});

		// Update display when target is changed
		socket.on ('update-target', function (target)
		{
			CurrentTarget = target;
			showDetails ();
		});

		// Update display when new log entry is created
		socket.on ('new-log', function (entry)
		{
			var table = $('#log-table > tbody');
			var row = formatLogRow (entry);
			table.prepend (row);
		});
	});

	/*********************************************************************************************/
	// Severity selection
	$('[data-severity]').on('change', function (e)
	{
		fillLogTable ();
	});

	/*********************************************************************************************/
	$('#cancel-target').click (function ()
	{
		$('#confirm-cancel').modal('show');
	});

	$('#confirm-cancel').on('click', '.btn-danger', function(e)
	{
		callServer ('cancel_target', {id: CurrentTarget.id}, function (err, data)
		{
			if (err)
			{
				$('#alert-bad-cancel span').text(err);
				showAlert ($('#alert-bad-cancel'));
			}
			else
			{
				CurrentTarget = data.target;
				showDetails ();
				$('#confirm-cancel').modal ('hide');
			}
		});
	});
});

/*********************************************************************************************/
function fillLogTable ()
{
	// Clear current log table
	var table = $('#log-table > tbody').empty();

	// Refresh log entry list with specified severities.
	var severities = [];
	$('[data-severity]').each(function ()
	{
		if ($(this).prop('checked'))
			severities.push ($(this).data('severity'));
	});

	// Anything to do?
	if (severities.length == 0)
		return;

	callServer ('get_log', {target_id: CurrentTarget.id, severity: severities}, function (err, data)
	{
		for (var n in data.entries)
		{
			var row = formatLogRow (data.entries[n]);
			table.append(row);
		}
	});
}

/*********************************************************************************************/
function showDetails ()
{
	$('#target-name').text(CurrentTarget.target);
	$('#target-title').text(CurrentTarget.target);
	$('#target-status').html(capitaliseFirstLetter (CurrentTarget.status) || '&nbsp;');

	if (CurrentTarget.outcome)
	{
		if (CurrentTarget.outcome == 'pass')
			var outcome_class = 'label-success';
		else
			var outcome_class = 'label-danger';
		$('#target-outcome').html('<span class="label ' + outcome_class + '">' + capitaliseFirstLetter (CurrentTarget.outcome) + '</span>');
	}
	else
		$('#target-outcome').html('&nbsp;');

	$('#target-agent-name').html(CurrentTarget.agent_name || '&nbsp;');
	$('#target-agent-id').html(CurrentTarget.agent_id || '&nbsp;');
	$('#target-record-id').text(CurrentTarget.id);
}

/*********************************************************************************************/
function formatLogRow (entry)
{
	switch (entry.severity)
	{
	case 'info':
		var severity_class = 'label-info';
		break;
	case 'warning':
		var severity_class = 'label-warning';
		break;
	case 'error':
		var severity_class = 'label-danger';
		break;
	default:
		var severity_class = 'label-success';
		break;
	}

	var row ='<tr>';
	row += '<td><span class="label ' + severity_class + '">' + entry.severity + '</span></td>';
	row += '<td>' + new Date (entry.created).toLocaleString ()+ '</td>';
	row += '<td>' + entry.entry + '</td>';
	row += '</tr>';

	return $(row);
}
