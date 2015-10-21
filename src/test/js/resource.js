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
