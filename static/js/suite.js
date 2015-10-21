var CurrentSuite = null;
console.log ('Suite JS loaded');
/*********************************************************************************************/
$(document).ready(function()
{
	callServer ('get_suite', {id: Id}, function (err, data)
	{
		console.log("get_suite data : " + JSON.stringify(data));
		if (err)
			return;
		console.log ('data : ' + JSON.stringify(data));
		CurrentSuite = data.suite;
		$('#heading').text(CurrentSuite.name);
		$('#suite-name').text (CurrentSuite.name);
		$('#suite-test-count').text (CurrentSuite.test_count);
		$('#suite-record-id').text (CurrentSuite.id);

		callServer ('get_tests', {suite_id: CurrentSuite.id}, function (err, data)
		{
			if (err)
				return;
			console.log("get_suites: " + JSON.stringify(data));
			var table = $('#tests-table > tbody');
			table.empty ();
			for (var n in data.tests)
			{
				var row = formatTestRow (data.tests[n]);
				row.data ('test-id', data.tests[n].id);
				table.append(row);
			}
		});

		callServer ('get_description', {suite_id: CurrentSuite.id}, function(err, data){
			if (err)
				return;
			console.log("get_description : " + JSON.stringify(data));
			var descriptionList = "";
			var finalDescription = [];
			console.log("length : " + data.tests.length);
			var dataLength = parseInt(data.tests.length);
			for (var i=0; i<dataLength; i++){
				finalDescription.push(data.tests[i].description);
			}
			finalDescription.sort();
			for(var n in finalDescription){
				descriptionList = descriptionList + "<li><a href='/summary?id="+ CurrentSuite.id+"&des=%27"+ finalDescription[n] +"%27' >" + finalDescription[n] + "</a></li>";
			}
			console.log("Constructed List : " + descriptionList);
			$('#summary').append(descriptionList);

		});

		/*callServer ('get_sequences', {suite_id: CurrentSuite.id}, function (err, data)
		{
			if (err)
				return;

			var table = $('#sequences-table > tbody');
			table.empty ();
			for (var n in data.sequences)
			{
				var row = formatSequenceRow (data.sequences[n]);
				row.data ('sequence-id', data.sequences[n].id);
				table.append(row);
			}
		});*/
	});

/*********************************************************************************************/
	$('#tests-table > tbody').on('click', 'tr', function (e)
	{
		var url = './test?id=' + $(this).data('test-id');
		location.href = url;
	});

/*********************************************************************************************/
	/*$('#sequences-table > tbody').on('click', 'tr', function (e)
	{
		var url = './sequence?id=' + $(this).data('sequence-id');
		location.href = url;
	});*/

/*********************************************************************************************/
	$('#create-test').on('show.bs.modal', function()
	{
		$('#create-test-name').val('');
	})
	.on('shown.bs.modal', function()
	{
		$('#create-test-name').focus();
	})
	.on('click', '.btn-primary', function(e)
	{
		var name = $('#create-test-name');
		if (name.val().length == 0)
		{
			$('#alert-bad-create span').text('Enter a name for the test');
			showAlert ($('#alert-bad-create'));
			$('#create-test-name').focus();
			return;
		}

		var description = $('#create-test-description');
		if (description.val().length == 0)
		{
			$('#alert-bad-create span').text('Enter a description for the test');
			showAlert ($('#alert-bad-create'));
			$('#create-test-description').focus();
			return;
		}

		callServer ('new_test', {name: name.val(), suite_id: Id, description: description.val()}, function (err, data)
		{
			if (err)
			{
				$('#alert-bad-create span').text(err);
				showAlert ($('#alert-bad-create'));
				$('#create-app-name').focus();
			}
			else
			{
				// last_outcome will be missing from new test record so add it as blank, since this is a new test
				data.test.last_outcome = '';
				var row = formatTestRow (data.test);
				row.data ('test-id', data.test.id);
				$('#tests-table > tbody').prepend (row);

				$(e.delegateTarget).modal ('hide');
			}
		});
	});

	$('#new-test').click (function ()
	{
		console.log("Create Test : clicked");
		$('#create-test').modal('show');
	});
});

/*********************************************************************************************/
function formatTestRow (test)
{
	if (test.last_outcome == 'pass')
		var outcome_class = 'label-success';
	else
		var outcome_class = 'label-danger';

	var row = '<tr style="cursor: pointer"><td class="text-primary">' + test.name + '</td>' +
		'<td><span class="label ' + outcome_class + '">' + capitaliseFirstLetter (test.last_outcome) + '</span></td></tr>';

	return $(row);
}

/*********************************************************************************************/
function formatSequenceRow (sequence)
{
	var row = '<tr style="cursor: pointer">';
	row += '<td class="text-success">' + sequence.id + '</td>';
	row += '<td class="text-primary">' + sequence.name + '</td>';
	row += '</tr>';

	return $(row);
}
