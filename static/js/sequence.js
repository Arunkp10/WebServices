var CurrentSequence = null;

/*********************************************************************************************/
$(document).ready(function()
{
	var socket = io ();

	callServer ('get_sequence', {id: Id}, function (err, data)
	{
		if (err)
			return;

		CurrentSequence = data.sequence;
		showDetails ();

		callServer ('get_suite', {id: CurrentSequence.suite_id}, function (err, data)
		{
			if (err) return;

			$('#suite-name').text (data.suite.name).attr('href','./suite?id=' + data.suite.id);
		});

		// Get log for this sequence and populate table
		callServer ('get_sequence_log', {id: CurrentSequence.id}, function (err, data)
		{
			var table = $('#log-table > tbody');
			table.empty ();
			for (var n in data.entries)
			{
				var row = formatLogRow (data.entries[n]);
				table.append(row);
			}
		});

		// Wait for connection then register for updates for this sequence
		socket.on ('connect', function ()
		{
			socket.emit ('register-sequence', CurrentSequence.id);
		});

		// Update display when sequence is changed
		/*socket.on ('update-target', function (target)
		{
			CurrentTarget = target;
			showDetails ();
		});*/

		// Update display when new log entry is created
		socket.on ('new-sequence-log', function (entry)
		{
			var table = $('#log-table > tbody');
			var row = formatLogRow (entry);
			table.prepend (row);
		});
	});

	// Prepare editor area
	var div = document.getElementById ('editor');
	var editor = ace.edit (div);
	editor.setTheme ('ace/theme/chrome');
	editor.getSession ().setMode ('ace/mode/javascript');
	$('#edit-modal').data ('editor', editor);

	/*****************************************************************************************/
	$('#start-sequence').click (function ()
	{
		callServer ('start_sequence', {id: CurrentSequence.id}, function (err, data)
		{
			//TODO Show any error/confirmation
		});
	});

	/*****************************************************************************************/
	$('#edit-script').click (function ()
	{
		var editor = $('#edit-modal').data ('editor');
		editor.setValue (CurrentSequence.code);
		editor.navigateFileStart ();

		$('#edit-modal').modal('show');
	});

	$('#edit-modal').on('show.bs.modal', function()
	{
	});

	$('#edit-modal').on('shown.bs.modal', function()
	{
		$('#edit-modal').data ('editor').focus ();
	});

	$('#edit-modal').on('click','.btn-primary', function()
	{
		var editor = $('#edit-modal').data ('editor');
		var code = editor.getValue ();

		callServer ('update_sequence', {id: CurrentSequence.id, code: code}, function (err, data)
		{
			if (err)
			{
				$('#alert-bad-edit span').text(err);
				showAlert ($('#alert-bad-edit'));
				editor.focus ();
			}
			else
			{
				CurrentSequence.code = code;
				$('#edit-modal').modal ('hide');
			}
		});
	});
});

/*********************************************************************************************/
function showDetails (sequence)
{
	$('#sequence-name').text(CurrentSequence.name);
	$('#sequence-description').html (CurrentSequence.description || '&nbsp;');
	$('#sequence-record-id').text(CurrentSequence.id);
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
