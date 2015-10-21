// Configure node-postgres so it returns COUNT() as integer not string
var pg = require ('pg');
pg.defaults.parseInt8 = true;
pg.defaults.user = "postgres";
pg.defaults.password = "root";

var util = require('util');

var auth = require ('basic-auth');
var nconf = require('nconf');
var express = require ('express');
var bodyparser = require('body-parser');
var multer = require ('multer');
var cors = require ('cors');
var app = express ();
var server = require ('http').createServer (app);
global.io = require('socket.io') (server);
var aws = require ('aws-sdk');

app.set ('views', __dirname + '/../views');
app.set ('view engine', 'jade');

app.use (cors());
app.use (bodyparser.json());
app.use (bodyparser.urlencoded({extended: true, type: 'application/x-www-form-urlencoded'}));
app.use (multer ({dest: './upload'}));
app.use (express.static (__dirname + '/../static'));

/*app.use (/^\/(?!interface)/, function (req, res, next)
{
	console.log ("Non-interface request");
	next ();
});*/

// Load configuration values
nconf.argv ();
nconf.env ();
nconf.file ({file: './config.json'});

/* Load request handlers {{{1 */
/* Each file of the form <requestname>_handler.js is assumed
to have a method handle (request, response) to handle the coresopnding request,
and which emits the 'done' event on completion.
Use a sync function because this only runs once to completion at start up */
var handlers = [];
var files = require('fs').readdirSync(__dirname + '/');
files.forEach(function(file)
{
	var match = file.match(/(.+)_handler\.js$/);
	if (match != null)
	{
		console.log ('Adding handler: ' + file);
		handlers[match[1]] = require('./' + file);
	}
});

/* Capture SIGINT (Ctrl-C) and exit {{{1 */
process.on ('SIGINT', function ()
{
	console.log ('SIGINT received, starting exit');
	process.exit ();
});

/* Exit handling {{{1 */
process.on ('exit', function ()
{
	console.log ('Exit handler complete');
});

global.io.on ('connection', function (socket)
{
	socket.on ('register', function (test_id)
	{
		// Data is test id; join corresponding room
		socket.join (test_id);
		console.log ('Room joined: %d', test_id);
	}).on ('deregister', function (test_id)
	{
		socket.leave (test_id);
		console.log ('Room left: %d', test_id);
	});
	
	socket.on ('register-run', function (run_id)
	{
		// Register for changes in run record - data is run record id
		socket.join ('run-' + run_id);
		console.log ('Registered for changes in run id: %d', run_id);
	});

	socket.on ('register-test', function (test_id)
	{
		// Register for changes in test record - data is test record id
		socket.join ('test-' + test_id);
		console.log ('Registered for changes in test id: %d', test_id);
	});

	// Register for changes in target record - data is target record id
	socket.on ('register-target', function (target_id)
	{
		socket.join ('target-' + target_id);
		console.log ('Registered for changes in target id: %d', target_id);
	});

	// Register for changes in sequence record, including changes to the sequence's log - data is sequence record id
	socket.on ('register-sequence', function (sequence_id)
	{
		socket.join ('sequence-' + sequence_id);
		console.log ('Registered for changes in sequence id: %d', sequence_id);
	});

	socket.on ('disconnect', function ()
	{
		console.log ('Socket disconnected');
	});
});

// Authentication handler
var basicAuth = function (request, response, next)
{
	var user = auth (request);
	if (!user || user.name != 'ats3user' || user.pass != '2ebra')
	{
		response.set ('WWW-Authenticate', 'Basic realm=ATS 3 authentication required');
		response.sendStatus (401);
	}
	else
		next ();
}

// Get test run package file - filename is returned by get_pending_runs call
app.get ('/package/:filename', function (request, response)
{
	var file = request.params.filename;
	response.attachment (file);
	response.sendFile (file, {root: './packages/'}, function (err)
	{
		if (err)
		{
			// Ignore errors because of 304 (not modified) codes
			if (response.statusCode == 304)
			{
				console.log ('Package %s not modified', file);
				return;
			}

			console.log ('Package %s caused error %d/%s', file, response.statusCode, err.toString());
			response.end ();
		}
		else
			console.log ('Package %s supplied', file);
	});
});

/* Main REST interface handler {{{1 */
app.post ('/interface', function (request, response)
{
	try
	{
		if (!('operation' in request.body))
			throw 'Missing parameter: operation';

		console.log ('Processing operation: ' + request.body.operation);

		if (!(request.body.operation in handlers))
			throw 'Unknown operation: ' + request.body.operation;

		var handler = handlers [request.body.operation].createHandler();
		handler.on ('done', function (err, answer)
		{
			if (err)
			{
				console.log ('Error: ' + err);
				answer = {result: 'error', message: err};
			}
			
			response.send (answer);
		});
		handler.handle (request.body, {result: 'ok'}, request.files);
	}
	catch (e)
	{
		answer = {result: 'error', message: e};
		response.send (answer);
		console.error (e);
	}
});

// Redirect default page
app.get ('/', basicAuth, function (request, response)
{
	response.redirect ('suites');
});

// Render suites page
app.get ('/suites', basicAuth, function (request, response, next)
{
	response.render ('suites', {pretty: true});
});

// Render suite detail page
app.get ('/suite', basicAuth, function (request, response)
{
	if (!request.query.id)
	{
		response.send (404);
		return;
	}

	response.render ('suite', {pretty: true, id: request.query.id});
});

// Render sequence detail page
app.get ('/sequence', basicAuth, function (request, response)
{
	if (!request.query.id)
	{
		response.send (404);
		return;
	}

	response.render ('sequence', {pretty: true, id: request.query.id});
});

// Render test detail page
app.get ('/test', basicAuth, function (request, response)
{
	if (!request.query.id)
	{
		response.send (404);
		return;
	}

	response.render ('test', {pretty: true, id: request.query.id});
});

// Render test run detail page
app.get ('/run', basicAuth, function (request, response)
{
	if (!request.query.id)
	{
		response.send (404);
		return;
	}

	response.render ('run', {pretty: true, id: request.query.id});
});

// Render test target detail page
app.get ('/target', basicAuth, function (request, response)
{
	if (!request.query.id)
	{
		response.send (404);
		return;
	}

	response.render ('target', {pretty: true, id: request.query.id});
});

// Render summary details page.

app.get('/summary', basicAuth, function (request, response){
	response.render ('summary', {pretty: true, id: request.query.id, des: request.query.des});
});


// Set the Amazon web services credentials from the config file
aws.config.update (nconf.get ('aws'));

// Start the web server
var server_port = nconf.get ('server_port');
var server_ip = nconf.get ('server_ip');

server.listen (server_port, server_ip, function ()
{
	console.log ('Server running on port %d on address %s', server_port, server_ip);
});

global.local_url = 'http://' + server_ip + ':' + server_port + '/interface';
console.log ('Local url: %s', global.local_url);

global.database = nconf.get ('database');
console.log ('Using database: %s', global.database);
