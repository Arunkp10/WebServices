var assert = require ('assert');
var should = require ('should');
var needle = require ('needle');
var child = require ('child_process');
var fs = require ('fs');
var q = require ('q');

// Build interface URL from command line parameters
var argv = require('minimist')(process.argv.slice(2));
var url = 'http://' + argv.ip + ':' + argv.port + '/interface';

var socket = require('socket.io-client')('http://' + argv.ip + ':' + argv.port);
socket.on ('connect', function ()
{
	// Register for push updates for test_id 1
	socket.emit ('register-test', 1);

	// Register for push updates for test run id 1
	socket.emit ('register-run', 1);

	// Register for push updates for sequence id 1
	socket.emit ('register-sequence', 1);
});

describe ('General Autotest REST API', function ()
{
	it ('should get version 0.1', function (done)
	{
		needle.post (url, {operation: 'get_version'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.version.major.should.equal (0);
			response.body.version.minor.should.equal (1);
			done ();
		});
	});
});

describe ('Suite-related methods', function ()
{
	it ('should add a new test suite', function (done)
	{
		needle.post (url, {operation: 'new_suite', name: 'New test suite 1'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.suite.id.should.equal (1, 'Wrong new suite record id returned');
			response.body.suite.name.should.equal ('New test suite 1', 'Wrong suite name returned');
			done ();
		});
	});

	it ('should add a second new test suite', function (done)
	{
		needle.post (url, {operation: 'new_suite', name: 'New test suite 2'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.suite.id.should.equal (2, 'Wrong new suite record id returned');
			response.body.suite.name.should.equal ('New test suite 2', 'Wrong suite name returned');
			done ();
		});
	});

	it ('should get test suite id 1', function (done)
	{
		needle.post (url, {operation: 'get_suite', id: 1}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.suite.id.should.equal (1, 'Wrong suite record id returned');
			response.body.suite.name.should.equal ('New test suite 1', 'Wrong suite name returned');
			response.body.suite.test_count.should.equal (0, 'Wrong suite test count returned');
			done ();
		});
	});

	it ('should get all test suites', function (done)
	{
		needle.post (url, {operation: 'get_suites'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.suites.should.have.length (2, 'Wrong number of suites returned');
			response.body.suites[0].id.should.equal (1, 'First suite has wrong id');
			response.body.suites[1].id.should.equal (2, 'Second suite has wrong id');
			done ();
		});
	});
});

// Now there are 2 test suites (ids 1 and 2) to which we can add tests.
// There are no tests as yet.

describe ('Test-related methods', function ()
{
	it ('should add a new test with id 1 to suite 1', function (done)
	{
		needle.post (url, {operation: 'new_test', name: 'New test 1', suite_id: 1, description: 'First test'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.test.id.should.equal (1, 'Wrong test record id returned');
			response.body.test.name.should.equal ('New test 1', 'Wrong test name returned');
			response.body.test.suite_id.should.equal (1, 'Wrong test suite_id returned');
			response.body.test.description.should.equal ('First test', 'Wrong test description returned');
			done ();
		});
	});

	it ('should get test suite id 1 with test count', function (done)
	{
		needle.post (url, {operation: 'get_suite', id: 1}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.suite.test_count.should.equal (1, 'Wrong suite test count returned');
			done ();
		});
	});

	it ('should add a new test with id 2 to suite 2 and default description', function (done)
	{
		needle.post (url, {operation: 'new_test', name: 'New test 2', suite_id: 2}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.test.id.should.equal (2, 'Wrong test record id returned');
			response.body.test.name.should.equal ('New test 2', 'Wrong test name returned');
			response.body.test.suite_id.should.equal (2, 'Wrong test suite_id returned');
			response.body.test.description.should.equal ('', 'Wrong test description returned');
			done ();
		});
	});

	it ('should get test id 1', function (done)
	{
		needle.post (url, {operation: 'get_test', id: 1}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.test.id.should.equal (1, 'Wrong test record id returned');
			response.body.test.name.should.equal ('New test 1', 'Wrong test name returned');
			response.body.test.suite_id.should.equal (1, 'Wrong test suite_id returned');
			response.body.test.targets.length.should.equal (0, 'Initial target length not zero');
			response.body.test.last_outcome.should.equal ('', 'Wrong test outcome returned');
			response.body.test.description.should.equal ('First test', 'Wrong test description returned');
			done ();
		});
	});

	it ('should clear the target list for test id 1', function (done)
	{
		needle.post (url, {operation: 'set_targets', targets: [], id: 1}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			done ();
		});
	});

	it ('should set the target list for test id 1', function (done)
	{
		needle.post (url, {operation: 'set_targets', targets: ['ce', 'wm'], id: 1}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			done ();
		});
	});

	it ('should get target list for test id 1', function (done)
	{
		needle.post (url, {operation: 'get_test', id: 1}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.test.targets.length.should.equal (2, 'Wrong number of targets returned');
			response.body.test.targets.should.containEql ('ce', 'CE target not present');
			response.body.test.targets.should.containEql ('wm', 'WM target not present');
			done ();
		});
	});

	it ('should get tests for suite id 2', function (done)
	{
		needle.post (url, {operation: 'get_tests', suite_id: 2}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.tests.should.have.length (1, 'Wrong number of tests returned');
			response.body.tests[0].id.should.equal (2, 'Wrong test record id returned');
			response.body.tests[0].name.should.equal ('New test 2', 'Wrong test name returned');
			response.body.tests[0].suite_id.should.equal (2, 'Wrong test suite_id returned');
			done ();
		});
	});

	it ('should upload a file for test id 1', function (done)
	{
		var data =
		{
			operation: 'upload_test_file',
			id: 1,
			upload: { file: './test.sh', content_type: 'application/octet-stream', geoff: 'great' }
		};

		needle.post (url, data, {multipart: true}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.files.should.have.length (1, 'Wrong number of files returned');
			response.body.files[0].id.should.equal (1, 'Wrong file id returned');
			response.body.files[0].test_id.should.equal (1, 'Wrong test_id returned');
			response.body.files[0].filename.should.equal ('test.sh', 'Wrong filename returned');
			response.body.files[0].type.should.equal ('binary', 'Wrong type returned');
			done ();
		});
	});

	it ('should upload a file for test id 1', function (done)
	{
		var data =
		{
			operation: 'upload_test_file',
			id: 1,
			upload: { file: './test.bin', content_type: 'application/octet-stream' }
		};

		needle.post (url, data, {multipart: true}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			done ();
		});
	});

	it ('should delete test id 2', function (done)
	{
		needle.post (url, {operation: 'delete_test', id: 2}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			done ();
		});
	});
	
	it ('should get zero tests for suite id 2', function (done)
	{
		needle.post (url, {operation: 'get_tests', suite_id: 2}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.tests.should.have.length (0, 'Wrong number of tests returned');
			done ();
		});
	});

	it ('should fail to get test id 2', function (done)
	{
		needle.post (url, {operation: 'get_test', id: 2}, {}, function (err, response)
		{
			response.body.result.should.equal ('error', 'Getting deleted test succeeded');
			done ();
		});
	});
});

// Test running test id 1
describe ('Run-related methods', function ()
{
	it ('should submit test id 1', function (done)
	{
		needle.post (url, {operation: 'submit_test', id: 1, description: 'test submission'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.run.id.should.equal (1, 'Wrong new run record id returned');
			response.body.run.test_id.should.equal (1, 'Wrong new run record test_id returned');
			response.body.run.description.should.equal ('test submission', 'Wrong new run record description returned');
			response.body.run.targets_total.should.equal (2, 'Wrong target total count returned');
			response.body.run.targets_pass.should.equal (0, 'Wrong target pass count returned');
			response.body.run.targets_fail.should.equal (0, 'Wrong target fail count returned');
			response.body.run.outcome.should.equal ('', 'Wrong new run record outcome returned');
			response.body.run.package.should.be.ok;
			done ();
		});
	});

	// THIS PUSH DOES WORK BUT IS NOT OFFICALLY SUPPORTED SO TEST COMMENT OUT FOR NOW
	/*it ('should submit test id 1 and wait for an update push', function (done)
	{
		this.timeout (2000);

		socket.once ('run-update', function (run)
		{
			run.id.should.equal (1, 'Wrong new run record id pushed');
			run.description.should.equal ('test submission', 'Wrong new run record description pushed');
			done ();
		});

		needle.post (url, {operation: 'submit_test', id: 1, description: 'test submission'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.run.id.should.equal (1, 'Wrong new run record id returned');
			response.body.run.description.should.equal ('test submission', 'Wrong new run record description returned');
		});
	});*/

	it ('should get the starting values for the test run', function (done)
	{
		needle.post (url, {operation: 'get_run', id: 1}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.run.id.should.equal (1, 'Wrong new run record id returned');
			response.body.run.test_id.should.equal (1, 'Wrong new run record test_id returned');
			response.body.run.description.should.equal ('test submission', 'Wrong new run record description returned');
			response.body.run.targets_total.should.equal (2, 'Wrong target total count returned');
			response.body.run.targets_pass.should.equal (0, 'Wrong target pass count returned');
			response.body.run.targets_fail.should.equal (0, 'Wrong target fail count returned');
			response.body.run.outcome.should.equal ('', 'Wrong new run record outcome returned');
			response.body.run.package.should.be.ok;

			var submitted = new Date (response.body.run.submitted);
			var elapsed = new Date() - submitted;
			elapsed.should.be.lessThan (100, 'Wrong submitted time set');

			done ();
		});
	});

	it ('should get all runs for test id 1', function (done)
	{
		needle.post (url, {operation: 'get_runs', test_id: 1}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.runs.should.have.length (1, 'Wrong number of runs returned');
			response.body.runs[0].id.should.equal (1, 'Wrong new run record id returned');
			response.body.runs[0].test_id.should.equal (1, 'Wrong new run record test_id returned');
			response.body.runs[0].description.should.equal ('test submission', 'Wrong new run record description returned');
			response.body.runs[0].targets_total.should.equal (2, 'Wrong target total count returned');
			response.body.runs[0].targets_pass.should.equal (0, 'Wrong target pass count returned');
			response.body.runs[0].targets_fail.should.equal (0, 'Wrong target fail count returned');
			response.body.runs[0].outcome.should.equal ('', 'Wrong new run record outcome returned');
			response.body.runs[0].package.should.be.ok;
			done ();
		});
	});

	it ('should download the package file for test run id 1', function (done)
	{
		// First get the package URL from the test run record
		needle.post (url, {operation: 'get_run', id: 1}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			should(response.body.run.package).be.ok;

			// Now download package file
			var package = 'http://' + argv.ip + ':' + argv.port + '/package/' + response.body.run.package;
			needle.get (package, {output: './package.zip'}, function (err, response)
			{
				should(err).not.be.ok;
				response.statusCode.should.equal (200, 'Wrong status code returned');
				done ();
			});
		});
	});

	it ('should get pending runs for target wm', function (done)
	{
		needle.post (url, {operation: 'get_pending_runs', targets: ['wm']}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.runs.should.have.length (1, 'Wrong number of runs returned');
			response.body.runs[0].id.should.equal (2, 'Wrong target id returned');
			response.body.runs[0].package.should.be.ok;
			done ();
		});
	});

	it ('should get pending runs for target ce', function (done)
	{
		needle.post (url, {operation: 'get_pending_runs', targets: ['ce']}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.runs.should.have.length (1, 'Wrong number of runs returned');
			response.body.runs[0].id.should.equal (1, 'Wrong target id returned');
			response.body.runs[0].package.should.be.ok;
			done ();
		});
	});

	it ('should get pending runs for both targets ce and wm', function (done)
	{
		needle.post (url, {operation: 'get_pending_runs', targets: ['ce', 'wm']}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.runs.should.have.length (2, 'Wrong number of runs returned');
			done ();
		});
	});

	it ('should get detail for target id 1', function (done)
	{
		needle.post (url, {operation: 'get_target', id: 1}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.target.id.should.equal (1, 'Wrong target record id returned');
			response.body.target.run_id.should.equal (1, 'Wrong target record run_id returned');
			response.body.target.target.should.equal ('ce', 'Wrong target record target returned');
			response.body.target.status.should.equal ('pending', 'Wrong target record status returned');
			response.body.target.agent_id.should.equal ('', 'Wrong target record agent_id returned');
			response.body.target.agent_name.should.equal ('', 'Wrong target record agent_name returned');
			response.body.target.outcome.should.equal ('', 'Wrong new target record outcome returned');
			done ();
		});
	});

	it ('should get all targets for run id 1', function (done)
	{
		needle.post (url, {operation: 'get_targets', run_id: 1}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.targets.should.have.length (2, 'Wrong number of targets returned');
			done ();
		});
	});

	it ('should execute target id 1 and wait for an update push', function (done)
	{
		this.timeout (2000);

		socket.once ('run-target', function (target)
		{
			target.status.should.equal ('executing', 'Wrong target status pushed');
			target.agent_id.should.equal ('agent_123', 'Wrong target agent id pushed');
			target.agent_name.should.equal ('test agent', 'Wrong target agent name pushed');
			done ();
		});

		needle.post (url, {operation: 'start_target', id: 1, agent_id: 'agent_123', agent_name: 'test agent'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
		});
	});

	it ('should try to execute target id 1 again', function (done)
	{
		needle.post (url, {operation: 'start_target', id: 1, agent_id: 'agent_123', agent_name: 'test agent'}, {}, function (err, response)
		{
			response.body.result.should.equal ('error', 'Not prevented starting the same target twice');
			done ();
		});
	});

	it ('should try to add a debug log entry for non-executing target id 2', function (done)
	{
		needle.post (url, {operation: 'log_target', id: 2, severity: 'debug', entry: 'A debug log entry'}, {}, function (err, response)
		{
			response.body.result.should.equal ('error', 'Log entry for non-executing target succeeded');
			done ();
		});
	});

	it ('should execute target id 2 and wait for an update push', function (done)
	{
		this.timeout (2000);

		socket.once ('run-target', function (target)
		{
			target.status.should.equal ('executing', 'Wrong target status pushed');
			target.agent_id.should.equal ('agent_456', 'Wrong target agent id pushed');
			target.agent_name.should.equal ('test agent 2', 'Wrong target agent name pushed');
			done ();
		});

		needle.post (url, {operation: 'start_target', id: 2, agent_id: 'agent_456', agent_name: 'test agent 2'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
		});
	});

	['debug', 'info', 'warning', 'error'].forEach (function (e)
	{
		it ('should add a ' + e + ' log entry for target id 1', function (done)
		{
			needle.post (url, {operation: 'log_target', id: 1, severity: e, entry: 'A ' + e + ' log entry'}, {}, function (err, response)
			{
				response.body.result.should.not.equal ('error', response.body.message);
				done ();
			});
		});
	});

	it ('should add a debug log entry for target id 2', function (done)
	{
		needle.post (url, {operation: 'log_target', id: 2, severity: 'debug', entry: 'A debug log entry'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			done ();
		});
	});

	it ('should get the log entries for target id 1', function (done)
	{
		needle.post (url, {operation: 'get_log', target_id: 1, severity: ['debug', 'info', 'warning', 'error']}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.entries.should.have.length (4, 'Wrong number of log entries returned');
			response.body.entries[0].severity.should.equal ('error', 'Wrong severity returned');
			response.body.entries[1].severity.should.equal ('warning', 'Wrong severity returned');
			response.body.entries[2].severity.should.equal ('info', 'Wrong severity returned');
			response.body.entries[3].severity.should.equal ('debug', 'Wrong severity returned');

			should (new Date().getTime() - new Date(response.body.entries[0].created)).be.lessThan (1000, 'Wrong log creation time returned');
			should (new Date().getTime() - new Date(response.body.entries[1].created)).be.lessThan (1000, 'Wrong log creation time returned');
			should (new Date().getTime() - new Date(response.body.entries[2].created)).be.lessThan (1000, 'Wrong log creation time returned');
			should (new Date().getTime() - new Date(response.body.entries[3].created)).be.lessThan (1000, 'Wrong log creation time returned');

			done ();
		});
	});

	it ('should get the error and info log entries for target id 1', function (done)
	{
		needle.post (url, {operation: 'get_log', target_id: 1, severity: ['error', 'info']}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.entries.should.have.length (2, 'Wrong number of log entries returned');
			response.body.entries[0].severity.should.equal ('error', 'Wrong severity returned');
			response.body.entries[1].severity.should.equal ('info', 'Wrong severity returned');
			done ();
		});
	});

	it ('should get no log entries for target id 1', function (done)
	{
		needle.post (url, {operation: 'get_log', target_id: 1, severity: []}, {}, function (err, response)
		{
			response.body.result.should.equal ('error', 'Log entries returned without severity');
			done ();
		});
	});

	it ('should get the log entries for target id 2', function (done)
	{
		needle.post (url, {operation: 'get_log', target_id: 2, severity: ['debug', 'info', 'warning', 'error']}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.entries.should.have.length (1, 'Wrong number of log entries returned');
			done ();
		});
	});

	it ('should mark target id 1 execution as done, wait for update pushes', function (done)
	{
		this.timeout (2000);

		var pushes = 0;

		socket.once ('test-run', function (run)
		{
			run.targets_pass.should.equal (1, 'Wrong run targets pass pushed');
			run.targets_fail.should.equal (0, 'Wrong run targets fail pushed');
			run.targets_total.should.equal (2, 'Wrong run targets total pushed');
			run.outcome.should.equal ('', 'Wrong run outcome pushed');
			if (++pushes == 2)
				done ();
		});

		socket.once ('run-target', function (target)
		{
			target.status.should.equal ('done', 'Wrong target status pushed');
			target.outcome.should.equal ('pass', 'Wrong target outcome pushed');
			if (++pushes == 2)
				done ();
		});

		needle.post (url, {operation: 'stop_target', id: 1, outcome: 'pass'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
		});
	});

	it ('should mark target id 2 execution as done, wait for update pushes', function (done)
	{
		this.timeout (2000);

		var pushes = 0;

		socket.once ('test-run', function (run)
		{
			run.targets_pass.should.equal (1, 'Wrong run targets pass pushed');
			run.targets_fail.should.equal (1, 'Wrong run targets fail pushed');
			run.targets_total.should.equal (2, 'Wrong run targets total pushed');
			run.outcome.should.equal ('fail', 'Wrong run outcome pushed');
			if (++pushes == 2)
				done ();
		});

		socket.once ('run-target', function (target)
		{
			target.status.should.equal ('done', 'Wrong target status pushed');
			target.outcome.should.equal ('fail', 'Wrong target outcome pushed');
			if (++pushes == 2)
				done ();
		});

		needle.post (url, {operation: 'stop_target', id: 2, outcome: 'fail'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
		});
	});

	it ('should get final outcome for run id 1', function (done)
	{
		needle.post (url, {operation: 'get_run', id: 1}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.run.outcome.should.equal ('fail', 'Wrong final run record outcome returned');
			done ();
		});
	});

	it ('should get test id 1 with outcome of most recent test run', function (done)
	{
		needle.post (url, {operation: 'get_test', id: 1}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.test.last_outcome.should.equal ('fail', 'Wrong test outcome returned');
			done ();
		});
	});

	it ('should get tests for suite id 1 with last outcomes', function (done)
	{
		needle.post (url, {operation: 'get_tests', suite_id: 1}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.tests.should.have.length (1, 'Wrong number of tests returned');
			response.body.tests[0].last_outcome.should.equal ('fail', 'Wrong test outcome returned');
			done ();
		});
	});
});

describe ('Test run cancellation methods', function ()
{
	it ('should submit test id 1', function (done)
	{
		needle.post (url, {operation: 'submit_test', id: 1, description: 'submission for cancellation'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			done ();
		});
	});

	var wm_target_id;

	it ('should get pending runs for target wm', function (done)
	{
		needle.post (url, {operation: 'get_pending_runs', targets: ['wm']}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			wm_target_id = response.body.runs[0].id;
			done ();
		});
	});

	it ('should cancel wm target', function (done)
	{
		needle.post (url, {operation: 'cancel_target', id: wm_target_id}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.target.status.should.equal ('cancelled', 'Wrong status returned');
			response.body.target.outcome.should.equal ('fail', 'Wrong outcome returned');
			done ();
		});
	});

	it ('should execute wm target', function (done)
	{
		needle.post (url, {operation: 'start_target', id: wm_target_id, agent_id: 'cancellation', agent_name: 'Cancellation agent'}, {}, function (err, response)
		{
			response.body.result.should.equal ('error', 'Cancelled target succeeded');
			done ();
		});
	});

	it ('should add a log entry for executing wm target', function (done)
	{
		needle.post (url, {operation: 'log_target', id: wm_target_id, severity: 'info', entry: 'Target has been cancelled'}, {}, function (err, response)
		{
			response.body.result.should.equal ('error', 'Cancelled target succeeded');
			done ();
		});
	});

	it ('should stop wm target execution', function (done)
	{
		needle.post (url, {operation: 'stop_target', id: wm_target_id, outcome: 'pass'}, {}, function (err, response)
		{
			response.body.result.should.equal ('error', 'Cancelled target succeeded');
			done ();
		});
	});

});

describe ('Sequence-related methods', function ()
{
	it ('should create a new sequence in suite id 1', function (done)
	{
		needle.post (url, {operation: 'new_sequence', suite_id: 1, name: 'Test sequence 1', code: 'Invalid code'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.sequence.id.should.equal (1, 'Wrong sequence id returned');
			response.body.sequence.suite_id.should.equal (1, 'Wrong sequence suite id returned');
			response.body.sequence.name.should.equal ('Test sequence 1', 'Wrong sequence name returned');
			response.body.sequence.code.should.equal ('Invalid code', 'Wrong sequence code returned');
			done ();
		});
	});

	it ('should get test sequence id 1', function (done)
	{
		needle.post (url, {operation: 'get_sequence', id: 1}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.sequence.id.should.equal (1, 'Wrong sequence id returned');
			response.body.sequence.suite_id.should.equal (1, 'Wrong sequence suite id returned');
			response.body.sequence.name.should.equal ('Test sequence 1', 'Wrong sequence name returned');
			response.body.sequence.code.should.equal ('Invalid code', 'Wrong sequence code returned');
			done ();
		});
	});

	it ('should set the code for sequence id 1', function (done)
	{
		needle.post (url, {operation: 'update_sequence', id: 1, code: 'New code'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.sequence.id.should.equal (1, 'Wrong sequence id returned');
			response.body.sequence.suite_id.should.equal (1, 'Wrong sequence suite id returned');
			response.body.sequence.name.should.equal ('Test sequence 1', 'Wrong sequence name returned');
			response.body.sequence.code.should.equal ('New code', 'Wrong sequence code returned');
			done ();
		});
	});

	it ('should set the name for sequence id 1', function (done)
	{
		needle.post (url, {operation: 'update_sequence', id: 1, name: 'New name'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.sequence.id.should.equal (1, 'Wrong sequence id returned');
			response.body.sequence.suite_id.should.equal (1, 'Wrong sequence suite id returned');
			response.body.sequence.name.should.equal ('New name', 'Wrong sequence name returned');
			response.body.sequence.code.should.equal ('New code', 'Wrong sequence name returned');
			done ();
		});
	});

	it ('should create a second new sequence in suite id 1', function (done)
	{
		needle.post (url, {operation: 'new_sequence', suite_id: 1, name: 'Test sequence 2'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.sequence.id.should.equal (2, 'Wrong sequence id returned');
			response.body.sequence.suite_id.should.equal (1, 'Wrong sequence suite id returned');
			response.body.sequence.name.should.equal ('Test sequence 2', 'Wrong sequence name returned');
			response.body.sequence.code.should.equal ('', 'Wrong sequence code returned');
			done ();
		});
	});

	it ('should get all sequences for suite id 1', function (done)
	{
		needle.post (url, {operation: 'get_sequences', suite_id: 1}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.sequences.should.have.length (2, 'Wrong number of sequences returned');

			response.body.sequences[0].id.should.equal (1, 'First sequence has wrong id');
			response.body.sequences[0].suite_id.should.equal (1, 'Wrong sequence suite id returned');
			response.body.sequences[0].name.should.equal ('New name', 'Wrong sequence name returned');
			should (response.body.sequences[0].code).not.be.ok;

			response.body.sequences[1].id.should.equal (2, 'Second sequence has wrong id');
			response.body.sequences[1].suite_id.should.equal (1, 'Wrong sequence suite id returned');
			response.body.sequences[1].name.should.equal ('Test sequence 2', 'Wrong sequence name returned');
			should (response.body.sequences[0].code).not.be.ok;

			done ();
		});
	});

	it ('should get no sequences for suite id 2', function (done)
	{
		needle.post (url, {operation: 'get_sequences', suite_id: 2}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.sequences.should.have.length (0, 'Wrong number of sequences returned');
			done ();
		});
	});

	it ('should create a log entry for sequence 1', function (done)
	{
		needle.post (url, {operation: 'log_sequence', id: 1, severity: 'info', entry: 'An info sequence log entry'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.entry.severity.should.equal ('info', 'Wrong severity returned');
			response.body.entry.entry.should.equal ('An info sequence log entry', 'Wrong entry returned');
			response.body.entry.sequence_id.should.equal (1, 'Wrong sequence id returned');
			response.body.entry.id.should.equal (1, 'Wrong id returned');

			var created = new Date (response.body.entry.created);
			var elapsed = new Date() - created;
			elapsed.should.be.lessThan (100, 'Wrong created time set');

			done ();
		});
	});

	it ('should get the log entries for sequence id 1', function (done)
	{
		needle.post (url, {operation: 'get_sequence_log', id: 1}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.entries.should.have.length (1, 'Wrong number of log entries returned');
			response.body.entries[0].id.should.equal (1, 'Wrong id returned');
			done ();
		});
	});

	it ('should start sequence id 1 and wait for an update push', function (done)
	{
		this.timeout (2000);

		socket.once ('new-sequence-log', function (entry)
		{
			entry.severity.should.equal ('debug', 'Wrong severity pushed');
			entry.entry.should.equal ('Log entry from running sequence', 'Wrong entry pushed');
			entry.sequence_id.should.equal (1, 'Wrong sequence id pushed');
			done ();
		});

		var code = "ats3.log ('debug', 'Log entry from running sequence');";
		needle.post (url, {operation: 'update_sequence', id: 1, code: code}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			needle.post (url, {operation: 'start_sequence', id: 1}, {}, function (err, response)
			{
				response.body.result.should.not.equal ('error', response.body.message);
			});
		});
	});
});

describe ('File related methods', function ()
{
	// Note, there are already 2 files from previous upload tests

	it ('should create a new text file', function (done)
	{
		needle.post (url, {operation: 'new_test_text_file', test_id: 1, filename: 'new_file_1'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.file.id.should.equal (3, 'Wrong file id returned');
			response.body.file.test_id.should.equal (1, 'Wrong test_id returned');
			response.body.file.filename.should.equal ('new_file_1', 'Wrong filename returned');
			response.body.file.type.should.equal ('text', 'Wrong type returned');
			done ();
		});
	});

	it ('should fail to create a new text file with the same name', function (done)
	{
		needle.post (url, {operation: 'new_test_text_file', test_id: 1, filename: 'new_file_1'}, {}, function (err, response)
		{
			response.body.result.should.equal ('error', response.body.message);
			done ();
		});
	});

	it ('should update test file id 3', function (done)
	{
		needle.post (url, {operation: 'update_test_file', id: 3, type: 'image'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.file.id.should.equal (3, 'Wrong file id returned');
			response.body.file.test_id.should.equal (1, 'Wrong test_id returned');
			response.body.file.filename.should.equal ('new_file_1', 'Wrong filename returned');
			response.body.file.type.should.equal ('image', 'Wrong type returned');
			done ();
		});
	});

	it ('should create a second new text file', function (done)
	{
		needle.post (url, {operation: 'new_test_text_file', test_id: 1, filename: 'new_file_2'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.file.id.should.equal (4, 'Wrong file id returned');
			response.body.file.test_id.should.equal (1, 'Wrong test_id returned');
			response.body.file.filename.should.equal ('new_file_2', 'Wrong filename returned');
			response.body.file.type.should.equal ('text', 'Wrong type returned');
			done ();
		});
	});

	it ('should get the list of files', function (done)
	{
		needle.post (url, {operation: 'get_test_files', test_id: 1}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.files.should.have.length (4, 'Wrong number of files returned');

			// Don't check individual files as the order is not defined
			done ();
		});
	});

	it ('should set the content of file id 1', function (done)
	{
		needle.post (url, {operation: 'set_test_file_content', file_id: 1, content: 'Some test content {[(<"\':&\'">)]}'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			done ();
		});
	});

	it ('should get the content of file id 1', function (done)
	{
		needle.post (url, {operation: 'get_test_file_content', file_id: 1}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.content.should.equal ('Some test content {[(<"\':&\'">)]}');
			done ();
		});
	});

	it ('should delete file id 4', function (done)
	{
		needle.post (url, {operation: 'delete_file', file_id: 4}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			done ();
		});
	});

	it ('should try deleting file id 4 again', function (done)
	{
		needle.post (url, {operation: 'delete_file', file_id: 4}, {}, function (err, response)
		{
			response.body.result.should.equal ('error', 'Able to delete the same file again');
			done ();
		});
	});
});

describe ('Non-file resource methods', function ()
{
	var test_id;

	it ('should create a new test for adding resources to', function (done)
	{
		needle.post (url, {operation: 'new_test', name: 'Resource test', suite_id: 2}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			test_id = response.body.test.id;
			done ();
		});
	});

	it ('should create a new text file', function (done)
	{
		needle.post (url, {operation: 'new_test_text_file', test_id: test_id, filename: 'new_resource_file'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			done ();
		});
	});

	var resource_id;

	it ('should create a reference to a public github resource for the test', function (done)
	{
		needle.post (url, {operation: 'new_test_resource',  test_id: test_id, type: 'github', name: 'adskjhasjkd', repository: 'blahblah', owner: 'eriutyrui', path: 'vmbnvmv'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.resource.id.should.equal (1, 'Wrong resource id returned');
			response.body.resource.test_id.should.equal (test_id, 'Wrong resource test id returned');
			response.body.resource.type.should.equal ('github', 'Wrong resource type returned');
			response.body.resource.name.should.equal ('adskjhasjkd', 'Wrong resource name returned');
			response.body.resource.repository.should.equal ('blahblah', 'Wrong repository returned');
			response.body.resource.owner.should.equal ('eriutyrui', 'Wrong owner returned');
			response.body.resource.path.should.equal ('vmbnvmv', 'Wrong path returned');
			resource_id = response.body.resource.id;
			done ();
		});
	});

	it ('should change an existing resource', function (done)
	{
		needle.post (url, {operation: 'change_test_resource', resource_id: resource_id, name: 'first resource', repository: 'hohum', owner: 'ats3user', path: '/ats3test.txt'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.resource.id.should.equal (1, 'Wrong resource id returned');
			response.body.resource.test_id.should.equal (test_id, 'Wrong resource test id returned');
			response.body.resource.type.should.equal ('github', 'Wrong resource type returned');
			response.body.resource.name.should.equal ('first resource', 'Wrong resource name returned');
			response.body.resource.repository.should.equal ('hohum', 'Wrong repository returned');
			response.body.resource.owner.should.equal ('ats3user', 'Wrong owner returned');
			response.body.resource.path.should.equal ('/ats3test.txt', 'Wrong path returned');
			done ();
		});
	});

	it ('should change one property of an existing resource', function (done)
	{
		needle.post (url, {operation: 'change_test_resource',  resource_id: resource_id, repository: 'hello'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.resource.id.should.equal (1, 'Wrong resource id returned');
			response.body.resource.test_id.should.equal (test_id, 'Wrong resource test id returned');
			response.body.resource.type.should.equal ('github', 'Wrong resource type returned');
			response.body.resource.name.should.equal ('first resource', 'Wrong resource name returned');
			response.body.resource.repository.should.equal ('hello', 'Wrong repository returned');
			response.body.resource.owner.should.equal ('ats3user', 'Wrong owner returned');
			response.body.resource.path.should.equal ('/ats3test.txt', 'Wrong path returned');
			done ();
		});
	});

	it ('should get the properties of the changed resource', function (done)
	{
		needle.post (url, {operation: 'get_test_resource',  resource_id: resource_id}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.resource.id.should.equal (1, 'Wrong resource id returned');
			response.body.resource.test_id.should.equal (test_id, 'Wrong resource test id returned');
			response.body.resource.type.should.equal ('github', 'Wrong resource type returned');
			response.body.resource.name.should.equal ('first resource', 'Wrong resource name returned');
			response.body.resource.repository.should.equal ('hello', 'Wrong repository returned');
			response.body.resource.owner.should.equal ('ats3user', 'Wrong owner returned');
			response.body.resource.path.should.equal ('/ats3test.txt', 'Wrong path returned');
			done ();
		});
	});

	it ('should create a reference to a private github resource for the test (without initial forward slash)', function (done)
	{
		needle.post (url, {operation: 'new_test_resource',  test_id: test_id, type: 'github', name: 'second resource', repository: 'Motorola-Extensions', owner: 'rhomobile', path: 'README.md'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.resource.id.should.equal (2, 'Wrong resource id returned');
			response.body.resource.test_id.should.equal (test_id, 'Wrong resource test id returned');
			response.body.resource.type.should.equal ('github', 'Wrong resource type returned');
			response.body.resource.name.should.equal ('second resource', 'Wrong resource name returned');
			done ();
		});
	});

	it ('should create a dummy resource for later deletion', function (done)
	{
		needle.post (url, {operation: 'new_test_resource',  test_id: test_id, type: 'github', name: 'third resource', repository: 'hello', owner: 'ats3user', path: 'nothing'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			done ();
		});
	});

	it ('should delete resource id 3', function (done)
	{
		needle.post (url, {operation: 'delete_resource', resource_id: 3}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			done ();
		});
	});

	it ('should fail to delete resource id 3 again', function (done)
	{
		needle.post (url, {operation: 'delete_resource', resource_id: 3}, {}, function (err, response)
		{
			response.body.result.should.equal ('error', 'Able to delete the same resource again');
			done ();
		});
	});

	it ('should create a reference to a github directory resource', function (done)
	{
		needle.post (url, {operation: 'new_test_resource',  test_id: test_id, type: 'github', name: 'directory resource', repository: 'hello', owner: 'ats3user', path: '/folder'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.resource.id.should.equal (4, 'Wrong resource id returned');
			response.body.resource.test_id.should.equal (test_id, 'Wrong resource test id returned');
			response.body.resource.type.should.equal ('github', 'Wrong resource type returned');
			response.body.resource.name.should.equal ('directory resource', 'Wrong resource name returned');
			done ();
		});
	});

	it ('should create an S3 resource', function (done)
	{
		needle.post (url, {operation: 'new_test_resource',  test_id: test_id, type: 's3', name: 'name1', bucket: 'bucket1', path: 'path1'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.resource.id.should.equal (5, 'Wrong resource id returned');
			response.body.resource.test_id.should.equal (test_id, 'Wrong resource test id returned');
			response.body.resource.type.should.equal ('s3', 'Wrong resource type returned');
			response.body.resource.name.should.equal ('name1', 'Wrong resource name returned');
			response.body.resource.bucket.should.equal ('bucket1', 'Wrong resource bucket returned');
			response.body.resource.path.should.equal ('path1', 'Wrong resource path returned');
			done ();
		});
	});

	it ('should get the properties of the S3 resource', function (done)
	{
		needle.post (url, {operation: 'get_test_resource',  resource_id: 5}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.resource.id.should.equal (5, 'Wrong resource id returned');
			response.body.resource.test_id.should.equal (test_id, 'Wrong resource test id returned');
			response.body.resource.type.should.equal ('s3', 'Wrong resource type returned');
			response.body.resource.name.should.equal ('name1', 'Wrong resource name returned');
			response.body.resource.bucket.should.equal ('bucket1', 'Wrong resource bucket returned');
			response.body.resource.path.should.equal ('path1', 'Wrong resource path returned');
			done ();
		});
	});

	it ('should change an existing S3 resource', function (done)
	{
		needle.post (url, {operation: 'change_test_resource', resource_id: 5, name: 'S3 resource', bucket: 'zebra-ats3', path: 's30.txt'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.resource.id.should.equal (5, 'Wrong resource id returned');
			response.body.resource.test_id.should.equal (test_id, 'Wrong resource test id returned');
			response.body.resource.type.should.equal ('s3', 'Wrong resource type returned');
			response.body.resource.name.should.equal ('S3 resource', 'Wrong resource name returned');
			response.body.resource.bucket.should.equal ('zebra-ats3', 'Wrong resource bucket returned');
			response.body.resource.path.should.equal ('s30.txt', 'Wrong resource path returned');
			done ();
		});
	});

	it ('should create a URL resource', function (done)
	{
		needle.post (url, {operation: 'new_test_resource',  test_id: test_id, type: 'url', name: 'name2', path: 'path2'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.resource.id.should.equal (6, 'Wrong resource id returned');
			response.body.resource.test_id.should.equal (test_id, 'Wrong resource test id returned');
			response.body.resource.type.should.equal ('url', 'Wrong resource type returned');
			response.body.resource.name.should.equal ('name2', 'Wrong resource name returned');
			response.body.resource.path.should.equal ('path2', 'Wrong resource path returned');
			done ();
		});
	});

	it ('should get the properties of the URL resource', function (done)
	{
		needle.post (url, {operation: 'get_test_resource',  resource_id: 6}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.resource.id.should.equal (6, 'Wrong resource id returned');
			response.body.resource.test_id.should.equal (test_id, 'Wrong resource test id returned');
			response.body.resource.type.should.equal ('url', 'Wrong resource type returned');
			response.body.resource.name.should.equal ('name2', 'Wrong resource name returned');
			response.body.resource.path.should.equal ('path2', 'Wrong resource path returned');
			done ();
		});
	});

	it ('should change an existing URL resource', function (done)
	{
		needle.post (url, {operation: 'change_test_resource', resource_id: 6, name: 'URL resource', path: 'https://s3-eu-west-1.amazonaws.com/zebra-ats3/url_resource.txt'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.resource.id.should.equal (6, 'Wrong resource id returned');
			response.body.resource.test_id.should.equal (test_id, 'Wrong resource test id returned');
			response.body.resource.type.should.equal ('url', 'Wrong resource type returned');
			response.body.resource.name.should.equal ('URL resource', 'Wrong resource name returned');
			response.body.resource.path.should.equal ('https://s3-eu-west-1.amazonaws.com/zebra-ats3/url_resource.txt', 'Wrong resource path returned');
			done ();
		});
	});

	it ('should get the resources for the test', function (done)
	{
		needle.post (url, {operation: 'get_test_resources', test_id: test_id}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			response.body.resources.should.have.length (5, 'Wrong number of resources returned');

			response.body.resources[0].id.should.equal (6, 'Wrong resource id returned');
			response.body.resources[0].test_id.should.equal (test_id, 'Wrong resource test id returned');
			response.body.resources[0].type.should.equal ('url', 'Wrong resource type returned');
			response.body.resources[0].name.should.equal ('URL resource', 'Wrong resource name returned');
			response.body.resources[0].path.should.equal ('https://s3-eu-west-1.amazonaws.com/zebra-ats3/url_resource.txt', 'Wrong resource path returned');

			response.body.resources[1].id.should.equal (5, 'Wrong resource id returned');
			response.body.resources[1].test_id.should.equal (test_id, 'Wrong resource test id returned');
			response.body.resources[1].type.should.equal ('s3', 'Wrong resource type returned');
			response.body.resources[1].name.should.equal ('S3 resource', 'Wrong resource name returned');
			response.body.resources[1].bucket.should.equal ('zebra-ats3', 'Wrong resource bucket returned');
			response.body.resources[1].path.should.equal ('s30.txt', 'Wrong resource path returned');

			response.body.resources[2].id.should.equal (4, 'Wrong resource id returned');
			response.body.resources[2].type.should.equal ('github', 'Wrong resource type returned');
			response.body.resources[2].name.should.equal ('directory resource', 'Wrong resource name returned');

			response.body.resources[3].id.should.equal (2, 'Wrong resource id returned');
			response.body.resources[3].type.should.equal ('github', 'Wrong resource type returned');
			response.body.resources[3].name.should.equal ('second resource', 'Wrong resource name returned');

			response.body.resources[4].id.should.equal (1, 'Wrong resource id returned');
			response.body.resources[4].type.should.equal ('github', 'Wrong resource type returned');
			response.body.resources[4].name.should.equal ('first resource', 'Wrong resource name returned');
			response.body.resources[4].test_id.should.equal (test_id, 'Wrong resource test id returned');
			response.body.resources[4].repository.should.equal ('hello', 'Wrong repository returned');
			response.body.resources[4].owner.should.equal ('ats3user', 'Wrong owner returned');
			response.body.resources[4].path.should.equal ('/ats3test.txt', 'Wrong path returned');

			done ();
		});
	});

	it ('should set the test targets', function (done)
	{
		needle.post (url, {operation: 'set_targets', targets: ['resource'], id: test_id}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			done ();
		});
	});

	var package;

	it ('should submit the test', function (done)
	{
		this.timeout (10000);

		needle.post (url, {operation: 'submit_test', id: test_id, description: 'submission for resource testing'}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			package = response.body.run.package;
			done ();
		});
	});

	it ('should download the package file', function (done)
	{
		var url = 'http://' + argv.ip + ':' + argv.port + '/package/' + package;
		needle.get (url, {output: './resource/package.zip'}, function (err, response)
		{
			should(err).not.be.ok;
			response.statusCode.should.equal (200, 'Wrong status code returned');
			done ();
		});
	});

	it ('should have the resource files in the package', function (finished)
	{
		q.nfcall (child.exec, 'cd resource ; find . -type f ! -name empty ! -name package.zip -delete ; unzip -o package.zip')
		.then (function () { return q.nfcall (fs.stat, './resource/new_resource_file'); })
		.then (function () { return q.nfcall (fs.stat, './resource/ats3test.txt'); })
		.then (function () { return q.nfcall (fs.stat, './resource/README.md'); })
		.then (function () { return q.nfcall (fs.stat, './resource/sub1.txt'); })
		.then (function () { return q.nfcall (fs.stat, './resource/sub2.txt'); })
		.then (function () { return q.nfcall (fs.stat, './resource/s30.txt'); })
		// NOT YET IMPLEMENTED IN SERVER .then (function () { return q.nfcall (fs.stat, './resource/url_resource.txt'); })
		.done (function () { finished (); });
	});

	var target_id = 0;

	it ('should get pending runs for target resource', function (done)
	{
		needle.post (url, {operation: 'get_pending_runs', targets: ['resource']}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);

			if (response.body.runs.length > 0)
				target_id = response.body.runs[0].id;

			done ();
		});
	});

	it ('should cancel the target', function (done)
	{
		needle.post (url, {operation: 'cancel_target', id: target_id}, {}, function (err, response)
		{
			response.body.result.should.not.equal ('error', response.body.message);
			done ();
		});
	});
});
