// Currently displayed Test
var CurrentTest = null;

// Currently running Run Id; the page's Test Id is pre-set during page render
var CurrentRunId = 0;

/*********************************************************************************************/
$(document).ready(function()
{
	var socket = io ();

	callServer ('get_test', {id: Id}, function (err, data)
	{
		if (err) return;

		CurrentTest = data.test;
		showDetails ();
		showTargets ();

		callServer ('get_suite', {id: CurrentTest.suite_id}, function (err, data)
		{
			if (err) return;

			$('#suite-name').text (data.suite.name).attr ('href','./suite?id=' + data.suite.id);
		});

		callServer ('get_runs', {test_id: CurrentTest.id}, function (err, data)
		{
			var table = $('#runs-table > tbody');
			table.empty ();
			for (var n in data.runs)
			{
				var row = formatRunRow (data.runs[n]);
				row.data ('run-id', data.runs[n].id);
				table.append(row);
			}
		});

		// Wait for connection then register for updates for this test
		socket.on ('connect', function ()
		{
			socket.emit ('register-test', CurrentTest.id);
		});

		socket.on ('test-run', function (run)
		{
			// Update displayed row if present
			var row = $('#runs-table > tbody > tr').filter (function ()
			{
				return $(this).data ('run-id') == run.id;
			});
			if (row.length == 0)
				return;
			var new_row = formatRunRow (run);
			new_row.data ('run-id', run.id);
			row.replaceWith (new_row);
		});
	});

	/************************************************************************************************************/
	// Prepare editor area
	var editor = ace.edit (document.getElementById ('editor'));
	editor.setTheme ('ace/theme/chrome');
	editor.getSession ().setMode ('ace/mode/plain_text');
	$('#edit-modal').data ('editor', editor);

	/************************************************************************************************************/
	// Show file editor
	$('#edit-modal').on('show.bs.modal', function()
	{
		var file = $(this).data('file');
		$(this).find('.edit-title').text(file.filename);
	});

	$('#edit-modal').on('shown.bs.modal', function()
	{
		var file = $(this).data('file');
		var editor =  $(this).data('editor');
		callServer ('get_test_file_content', {file_id: file.id}, function (err, data)
		{
			if (err) return;
			editor.setValue(data.content);
			editor.navigateFileStart();
			editor.focus();
		});
	});

	$('#edit-modal').on('click', '.btn-primary', function(e)
	{
		var file = $(e.delegateTarget).data('file');
		var content = $(e.delegateTarget).data('editor').getValue();
		callServer ('set_test_file_content', {file_id: file.id, content: content}, function (err, data)
		{
			$(e.delegateTarget).modal ('hide');
		});
	});

	/************************************************************************************************************/
	// Show dialog to confirm file delete
	$('#delete-file-modal').on('show.bs.modal', function ()
	{
		var file = $(this).data('file');
		$(this).find('#delete-file-name').text(file.filename);
	});

	$('#delete-file-modal').on('click', '.btn-danger', function (e)
	{
		var file = $(e.delegateTarget).data('file');
		callServer ('delete_file', {file_id: file.id}, function (err, data)
		{
			if (err)
			{
				$('#alert-bad-delete-file span').text(err);
				showAlert ($('#alert-bad-delete-file'));
			}
			else
			{
				// Remove displayed row if present
				var row = $('#files-table > tbody > tr').filter (function ()
				{
					return $(this).data('file').id == file.id;
				});
				if (row.length >= 0)
					row.remove ();

				$(e.delegateTarget).modal ('hide');
			}
		});
	});

	/************************************************************************************************************/
	// Respond to changes in file type dropdown
	$('#files-table').on ('click', 'a.file-type', function (e)
	{
		var target = $(e.target);
		var row = target.closest ('tr');
		var file = row.data ('file');
		var new_type = target.text ();

		callServer ('update_test_file', {id: file.id, type: new_type}, function (err, data)
		{
			if (err) return;

			var new_row = formatFileRow (data.file);
			row.replaceWith (new_row);
		});
	});

	/************************************************************************************************************/
	// Show table of files and respond to clicks
	$('#files-table').on ('click', 'span.file-modify', function (e)
	{
		var target = $(e.target);
		var file = target.closest ('tr').data ('file');

		if (target.hasClass ('file-edit'))
		{
			// Store the file object with the modal dialog
			$('#edit-modal').data ('file', file);
			$('#edit-modal').modal('show');
		}
		else if (target.hasClass ('file-delete'))
		{
			// Store the file object with the modal dialog
			$('#delete-file-modal').data ('file', file);
			$('#delete-file-modal').modal('show');
		}
	});

	$('#show-files').on ('click', function (e)
	{
		var div = $('#files-div');

		if (div.is (':visible'))
		{
			$('#show-files').children ('span').removeClass ('dropup');
			div.slideUp ('fast');
		}
		else
		{
			callServer ('get_test_files', {test_id: CurrentTest.id}, function (err, data)
			{
				if (err) return;

				var table = $('#files-table > tbody');
				table.empty ();
				for (var n in data.files)
				{
					var row = formatFileRow (data.files[n]);
					table.append(row);
				}

				$('#show-files').children ('span').addClass ('dropup');
				div.slideDown ('fast');
			});
		}
	});

	/************************************************************************************************************/
	// New text file
	$('#new-file').on('click', function ()
	{
		$('#new-file-modal').modal('show');
	});

	$('#new-file-modal').on('show.bs.modal', function(e)
	{
		$('#new-file-name').val('');
	});

	$('#new-file-modal').on('shown.bs.modal', function()
	{
		$('#new-file-name').focus();
	});

	$('#new-file-modal').on('click', '.btn-primary', function()
	{
		var filename = $('#new-file-name');
		if (filename.val().length == 0)
		{
			$('#alert-bad-new-file span').text('Enter a filename');
			showAlert ($('#alert-bad-new-file'));
			filename.val('').focus();
			return;
		}

		callServer ('new_test_text_file', {test_id: CurrentTest.id, filename: filename.val()}, function (err, data)
		{
			if (err)
			{
				$('#alert-bad-new-file span').text(err);
				showAlert ($('#alert-bad-new-file'));
				filename.val('').focus();
			}
			else
			{
				var row = formatFileRow (data.file);
				$('#files-table > tbody').prepend(row);
				$('#new-file-modal').modal ('hide');
			}
		});
	});

	/************************************************************************************************************/
	$('#runs-table').on ('click', 'tbody > tr', function (e)
	{
		var run_id = $(this).data ('run-id');
		location.href = './run?id=' + run_id;
	});

	/************************************************************************************************************/
	$('#set-targets').click (function()
	{
		$('#targets-modal').modal('show');
	});

	$('#targets-modal').on('click', '.glyphicon-remove-sign', function (e)
	{
		$(e.target).closest('tr').remove();
	});

	$('#targets-modal').on('show.bs.modal', function(e)
	{
		$('#new-target').val('');

		var table = $('#targets-table > tbody');
		table.empty ();
		for (var n in CurrentTest.targets)
		{
			var row = $('<tr><td class="col-sm-3" style="border: none">' + CurrentTest.targets[n] + '</td><td style="border: none"><span class="glyphicon glyphicon-remove-sign text-danger"></span></td></tr>');
			table.append(row);
		}
	});

	$('#add-target').click (function(e)
	{
		var new_target = $('#new-target').val();

		if (new_target.length == 0)
		{
			$('#alert-bad-set-targets span').text('Enter a new target name');
			showAlert ($('#alert-bad-set-targets'));
			return;
		}

		var table = $('#targets-table > tbody');
		var row = $('<tr><td class="col-sm-3" style="border: none">' + new_target + '</td><td style="border: none"><span class="glyphicon glyphicon-remove-sign text-danger"></span></td></tr>');
		table.append(row);
		$('#new-target').val('');
	});

	$('#new-target').on('keydown', function (e)
	{
		if (e.which == 13)
			$('#add-target').click();
	});

	$('#targets-modal').on('click','.btn-primary', function()
	{
		// Get array of target names
		var targets = $('#targets-table tr > :first-child').map(function(){return $(this).text()}).get();

		// Call server to set targets for current test
		callServer ('set_targets', {targets: targets, id: CurrentTest.id}, function (err, data)
		{
			if (err)
			{
				$('#alert-bad-set-targets span').text(err);
				showAlert ($('#alert-bad-set-targets'));
				$('#new-target').val('');
			}
			else
			{
				$('#targets-modal').modal ('hide');
				CurrentTest.targets = targets;
				showTargets ();
			}
		});
	});

	/************************************************************************************************************/
	$('#test-submit').click (function()
	{
		$('#submit-modal').modal('show');
	});

	$('#submit-modal').on('show.bs.modal', function(e)
	{
		$('#submit-description').val('');
	});

	$('#submit-modal').on('shown.bs.modal', function()
	{
		$('#submit-description').focus();
	});

	$('#submit-modal').on('click','.btn-primary', function()
	{
		// Get the test run description, check it's not empty
		var description = $('#submit-description');
		if (description.val().length == 0)
		{
			$('#alert-bad-submit span').text('Enter a description');
			showAlert ($('#alert-bad-submit'));
			description.val('').focus();
			return;
		}

		// Call the server API to submit the test
		callServer ('submit_test', {id: CurrentTest.id, description: description.val()}, function (err, data)
		{
			if (err)
			{
				$('#alert-bad-submit span').text(err);
				showAlert ($('#alert-bad-submit'));
				description.focus();
			}
			else
			{
				// Add new run record as returned by API call to table
				var row = formatRunRow (data.run);
				row.data ('run-id', data.run.id);
				$('#runs-table > tbody').prepend (row);

				$('#submit-modal').modal ('hide');
			}
		});
	});

	/************************************************************************************************************/
	$('#delete-confirm').on('show.bs.modal', function(e)
	{
		$('#delete-test-name').text(CurrentTest.name);
		$('#delete-confirm-name').val('');
	}).on('shown.bs.modal', function()
	{
		$('#delete-confirm-name').focus();
	}).on('click', '.btn-danger', function(e)
	{
		var confirmation = $('#delete-confirm-name');
		if (confirmation.val() != CurrentTest.name)
		{
			$('#alert-bad-delete span').text('Confirm the test name');
			showAlert ($('#alert-bad-delete'));
			confirmation.val('').focus();
			return;
		}

		// Really delete it now
		deleteTest (CurrentTest.id, function (err, data)
		{
			if (err)
			{
				$('#alert-bad-delete span').text(err);
				showAlert ($('#alert-bad-delete'));
				confirmation.val('').focus();
			}
			else
			{
				$(e.delegateTarget).modal ('hide');
				location.href = './suite?id=' + CurrentTest.suite_id;
			}
		});
	});

	$('#delete-test').click (function ()
	{
		$('#delete-confirm').modal('show');
	});

	/************************************************************************************************************/
	// Initialise empty FormData object when showing Upload File dialog
	$('#upload-modal').on('show.bs.modal', function(e)
	{
		var data = new FormData ();
		data.append ('operation', 'upload_test_file');
		data.append ('id', CurrentTest.id);
		$(this).data ('formdata', data);
		$('#file-list').empty();
	});

	// Handle adding files to list in Upload Files dialog
	// Add selected files to FormData object owned by dialog object
	$('#add-files').change(function(e)
	{
		var files = e.target.files;
		if (!files || files.length == 0)
			return;
		var list = $('#file-list');
		var data = $('#upload-modal').data('formdata');
		for (var n = 0; n < files.length; n++)
		{
			list.append ($('<p class="form-control-static">' + files[n].name + '</p>'));
			data.append ('file-' + n, files[n]);
		}
	});

	// Upload selected files
	$('#upload-modal').on('click','.btn-primary', function()
	{
		if ($('#file-list > p').length == 0)
		{
			$('#alert-bad-upload span').text('No files selected');
			showAlert ($('#alert-bad-upload'));
			return;
		}

		var data = $('#upload-modal').data('formdata');
		uploadFile (CurrentTest.id, data, function (err, response)
		{
			if (err)
			{
				$('#alert-bad-upload span').text(err);
				showAlert ($('#alert-bad-upload'));
			}
			else
			{
				// Add new files to file table
				var table = $('#files-table > tbody');
				for (var n in response.files)
				{
					var row = formatFileRow (response.files[n]);
					table.prepend (row);
				}

				$('#upload-modal').modal ('hide');
			}
		});
	});

	// Show Upload Files dialog
	$('#upload-files').click (function ()
	{
		$('#upload-modal').modal('show');
	});

});

/*********************************************************************************************/
function showDetails (test)
{
	$('#test-name').text (CurrentTest.name);
	$('#test-description').html (CurrentTest.description || '&nbsp;');
	$('#test-record-id').text (CurrentTest.id);
}

/*********************************************************************************************/
function showTargets ()
{
	// Show list of targets
	var target_title = $('#test-targets').empty();
	for (n = 0; n < CurrentTest.targets.length; n++)
	{
		var target = '<span class="label label-default">' + CurrentTest.targets[n] + '</span>&nbsp;';
		target_title.append (target);
	}

	// Prevent the list being empty
	target_title.append ('&nbsp;');
}

/*********************************************************************************************/
function formatFileRow (file)
{
	var row = '<tr>';
	row += '<td>' + file.id + '</td>';

	// Add file type as dropdown allowing user to change file type
	row += '<td class="dropdown"><span style="cursor: pointer" class="dropdown-toggle" data-toggle="dropdown">' + file.type + '&nbsp;' +
		'<span class="caret"></span></span><ul class="dropdown-menu">' +
		'<li><a class="file-type" href="#">text</a></li>' +
		'<li><a class="file-type" href="#">binary</a></li>' +
		'<li><a class="file-type" href="#">image</a></li>' +
		'</ul></td>';

	row += '<td>' + file.filename + '</td>';
	row += '<td>';
	//row += '<span style="cursor: pointer" class="file-download glyphicon glyphicon-download text-warning"></span>';
	row += '<span style="cursor: pointer" class="file-modify file-delete glyphicon glyphicon-remove-sign text-danger"></span>';
	
	if (file.type == 'text')
		//row += '&emsp;<span style="cursor: pointer" class="file-edit glyphicon glyphicon-edit text-successr"></span></td>';
		row += '&emsp;<span style="cursor: pointer" class="file-modify file-edit glyphicon glyphicon-edit text-success"></span></td>';
	else
		row += '</td>';

	row += '</tr>';

	return $(row).data ('file', file);
}

/*********************************************************************************************/
function formatRunRow (run)
{
	var targets_done = run.targets_pass + run.targets_fail;

	if (run.outcome == 'pass')
		var outcome_class = 'label-success';
	else
		var outcome_class = 'label-danger';

	var row =  '<tr style="cursor: pointer"><td>' + run.id + '</td>' +
		'<td>' + new Date (run.submitted).toLocaleString() + '</td>' +
		'<td>' + run.description + '</td>' +
		'<td>' + targets_done + ' / ' + run.targets_total + '</td>' +
		'<td><span class="label ' + outcome_class + '">' + capitaliseFirstLetter (run.outcome) + '</span></td></tr>';

	return $(row);
}

/*********************************************************************************************/
function editFile (file)
{
	var editor = $('#edit-modal').data ('editor');
	editor.setValue ('Geoff is great!');
	editor.navigateFileStart ();
	$('#edit-title').text (file.filename);

	$('#edit-modal').modal('show');
}

/*********************************************************************************************/
function deleteTest (id, callback)
{
	$.ajax(
	{
		url: './interface',
		type: 'POST',
		data: {operation: 'delete_test', id: id},
		dataType: 'json',
		success: function(response)
		{
			if (response.result == 'ok')
			{
				callback (null, response);
			}
			else
			{
				console.error(response.message);
				callback (response.message);
			}
		},
		error: function(xhr, status, error)
		{
			console.error (error);
			callback (error);
		}
	});
}

/*********************************************************************************************/
function uploadFile (id, data, callback)
{
	$.ajax(
	{
		url: './interface',
		type: 'POST',
		data: data,
		processData: false,
		contentType: false,
		dataType: 'json',
		success: function(response)
		{
			if (response.result == 'ok')
			{
				callback (null, response);
			}
			else
			{
				console.error(response.message);
				callback (response.message);
			}
		},
		error: function(xhr, status, error)
		{
			console.error (error);
			callback (error);
		}
	});
}

$(document).ready(function()
{
	/************************************************************************************************************/
	// Show resource section
	/************************************************************************************************************/
	$('#show-resources').on ('click', function (e)
	{
		var div = $('#resources-div');

		if (div.is (':visible'))
		{
			$('#show-resources').children ('span').removeClass ('dropup');
			div.slideUp ('fast');
		}
		else
		{
			callServer ('get_test_resources', {test_id: CurrentTest.id}, function (err, data)
			{
				if (err) return;

				var table = $('#resources-table > tbody');
				table.empty ();
				for (var n in data.resources)
				{
					var row = formatResourceRow (data.resources[n]);
					table.append(row);
				}

				$('#show-resources').children ('span').addClass ('dropup');
				div.slideDown ('fast');
			});
		}
	});

	/************************************************************************************************************/
	// Handle click on icon in resource row
	/************************************************************************************************************/
	$('#resources-table').on ('click', 'span.resource-modify', function (e)
	{
		var target = $(e.target);
		var resource = target.closest ('tr').data ('resource');

		if (target.hasClass ('resource-edit'))
		{
			// Add the existing resource object to the dialog, indicating this is edit rather than create
			$('#new-resource-modal').data ('resource', resource);
			$('#new-resource-modal').modal('show');
		}
		else if (target.hasClass ('resource-delete'))
		{
			$('#delete-resource-modal').data ('resource', resource);
			$('#delete-resource-modal').modal('show');
		}
	});

	/************************************************************************************************************/
	// Confirm resource deletion
	/************************************************************************************************************/
	$('#delete-resource-modal').on('show.bs.modal', function ()
	{
		var resource = $(this).data('resource');
		$(this).find('#delete-resource-name').text(resource.name);
	});

	$('#delete-resource-modal').on('click', '.btn-danger', function (e)
	{
		var resource = $(e.delegateTarget).data('resource');
		callServer ('delete_resource', {resource_id: resource.id}, function (err, data)
		{
			if (err)
			{
				$('#alert-bad-delete-resource span').text(err);
				showAlert ($('#alert-bad-delete-resource'));
			}
			else
			{
				// Remove displayed row if present
				var row = $('#resources-table > tbody > tr').filter (function ()
				{
					return $(this).data('resource').id == resource.id;
				});
				if (row.length >= 0)
					row.remove ();

				$(e.delegateTarget).modal ('hide');
			}
		});
	});

	/************************************************************************************************************/
	// Show new resource dialog
	/************************************************************************************************************/
	$('#new-resource').on('click', function ()
	{
		// Clear resource data to show this is a create request
		$('#new-resource-modal').data ('resource', null);
		$('#new-resource-modal').modal('show');
	});

	// Get current tab name from toggle
	$('#new-resource-modal').on('shown.bs.tab', 'a[data-toggle="tab"]', function(e)
	{
		current_tab = $(this).attr('href').slice(1);
	});

	$('#new-resource-modal').on('show.bs.modal', function()
	{
		// Dialog about to be shown, set the default values, all blank first, then show any existing values
		var resource = $(this).data('resource');
		$(this).find('input[type="text"]').val('');

		if (resource)
		{
			switch (resource.type)
			{
				case 'github':
					$('#new-github-name').val(resource.name);
					$('#new-github-owner').val(resource.owner);
					$('#new-github-repository').val(resource.repository);
					$('#new-github-path').val(resource.path);
					break;

				case 's3':
					$('#new-s3-name').val(resource.name);
					$('#new-s3-bucket').val(resource.bucket);
					$('#new-s3-path').val(resource.path);
					break;
			}
		}

		// Enable only the existing tab, or all of them
		if (resource)
		{
			$(this).find('.nav-pills li').each (function ()
			{
				var element = $(this);
				if (element.find('a').attr('href').slice(1) == resource.type)
					element.removeClass('disabled').find('a').attr('data-toggle','tab');
				else
					element.addClass('disabled').find('a').removeAttr('data-toggle');
			});
		}
		else
		{
			$(this).find('.nav-pills li').removeClass('disabled').find('a').attr('data-toggle','tab');
		}

		var current_tab = '';

		// Make no tab active, then activate one, so we always get the tab event, github by default
		$('#new-resource-modal .active').removeClass ('active');
		if (resource)
			$('#new-resource-modal a[href="#' + resource.type + '"]').tab('show');
		else
			$('#new-resource-modal a[href="#github"]').tab('show');
	});

	/************************************************************************************************************/
	// Save new resource
	/************************************************************************************************************/
	$('#new-resource-modal').on('click', '.btn-primary', function(e)
	{
		var resource = $(e.delegateTarget).data('resource');

		switch (current_tab)
		{
			case 'github':
				var name = $('#new-github-name');
				if (name.val().length == 0)
				{
					$('#alert-bad-new-resource span').text('Enter a description');
					showAlert ($('#alert-bad-new-resource'));
					name.focus();
					return;
				}

				var owner = $('#new-github-owner');
				if (owner.val().length == 0)
				{
					$('#alert-bad-new-resource span').text('Enter an owner');
					showAlert ($('#alert-bad-new-resource'));
					owner.focus();
					return;
				}

				var repository = $('#new-github-repository');
				if (repository.val().length == 0)
				{
					$('#alert-bad-new-resource span').text('Enter an repository');
					showAlert ($('#alert-bad-new-resource'));
					repository.focus();
					return;
				}

				var path = $('#new-github-path');
				if (path.val().length == 0)
				{
					$('#alert-bad-new-resource span').text('Enter a path');
					showAlert ($('#alert-bad-new-resource'));
					path.focus();
					return;
				}

				if (resource)
					var data = {resource_id: resource.id, name: name.val(), repository: repository.val(), owner: owner.val(), path: path.val()};
				else
					var data = {test_id: CurrentTest.id, type: 'github', name: name.val(), repository: repository.val(), owner: owner.val(), path: path.val()};

				break;

			case 's3':
				var name = $('#new-s3-name');
				if (name.val().length == 0)
				{
					$('#alert-bad-new-resource span').text('Enter a description');
					showAlert ($('#alert-bad-new-resource'));
					name.focus();
					return;
				}

				var bucket = $('#new-s3-bucket');
				if (bucket.val().length == 0)
				{
					$('#alert-bad-new-resource span').text('Enter a bucket');
					showAlert ($('#alert-bad-new-resource'));
					bucket.focus();
					return;
				}

				var path = $('#new-s3-path');
				if (path.val().length == 0)
				{
					$('#alert-bad-new-resource span').text('Enter a path');
					showAlert ($('#alert-bad-new-resource'));
					path.focus();
					return;
				}

				if (resource)
					var data = {resource_id: resource.id, name: name.val(), bucket: bucket.val(), path: path.val()};
				else
					var data = {test_id: CurrentTest.id, type: 's3', name: name.val(), bucket: bucket.val(), path: path.val()};

				break;
			}

			if (resource)
			{
				callServer ('change_test_resource', data, function (err, data)
				{
					if (err)
					{
						$('#alert-bad-new-resource span').text(err);
						showAlert ($('#alert-bad-new-resource'));
						name.focus();
					}
					else
					{
						var row = $('#resources-table > tbody > tr').filter (function ()
						{
							return $(this).data('resource').id == resource.id;
						});
						if (row.length >= 0)
							row.replaceWith (formatResourceRow (data.resource));
						$('#new-resource-modal').modal ('hide');
					}
				});
			}
			else
			{
				callServer ('new_test_resource', data, function (err, data)
				{
					if (err)
					{
						$('#alert-bad-new-resource span').text(err);
						showAlert ($('#alert-bad-new-resource'));
						name.focus();
					}
					else
					{
						var row = formatResourceRow (data.resource);
						$('#resources-table > tbody').prepend(row);
						$('#new-resource-modal').modal ('hide');
					}
				});
			}
	});
});

/*********************************************************************************************/
function formatResourceRow (resource)
{
	var row = '<tr>';
	row += '<td>' + resource.id + '</td>';
	row += '<td>' + resource.type + '</td>';
	row += '<td>' + resource.name + '</td>';

	row += '<td><span style="cursor: pointer" class="resource-modify resource-delete glyphicon glyphicon-remove-sign text-danger"></span>';
	row += '&emsp;<span style="cursor: pointer" class="resource-modify resource-edit glyphicon glyphicon-edit text-success"></span></td>';

	row += '</tr>';

	return $(row).data ('resource', resource);
}
