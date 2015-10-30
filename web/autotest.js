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


// Load configuration values
nconf.argv ();
nconf.env ();
nconf.file ({file: './config.json'});


//executing shell commands

var exec = require('child_process').exec;



/* Load request handlers {{{1 */
/* Each file of the form <requestname>_handler.js is assumed
to have a method handle (request, response) to handle the coresopnding request,
and which emits the 'done' event on completion.
Use a sync function because this only runs once to completion at start up */
var handlers = [];
var files = require('fs').readdirSync(__dirname + '/');

var fs = require('fs');
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
process.on ('SIGINT', function (){
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
	if (!user || user.name != 'admin' || user.pass != 'admin')
	{
		response.set ('WWW-Authenticate', 'Basic realm=Authentication required');
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


app.post('/images', function (request, response){
	if(request.body.barcode){
		if(request.files.icu == undefined || request.files.icu == null || request.files.icu == "" || request.files.icu == {}){
			response.send({"result":"error", "message":"No image found"});
			return;
		} else {
			console.log("Upload Success !" + JSON.stringify(request.files));
			console.log("Upload Success !" + JSON.stringify(request.body));
			
			var barcodeData = request.body.barcode;
			var answer = {};

			// shell exec : image to xml - extractor.sh with image path parameter.
			function puts(error, stdout, stderr) { sys.puts(stdout) }
			exec("ls -la", function(error, stdout, stderr){
			  if (!error) {
			    // things worked!
			    console.log("Worked !");
			    console.log("output" + stdout);
			  } else {
			    // things failed :(
			    console.log("Didnot worked!");
				return;
			  }
			});

			// Shell exec : rename the xml
			var xmlname = request.files.icu.originalname;

			// DB thread : inserting both barcode and image path in to the db.
			pg.connect (global.database, function (err, client, done)
			{
				client.query ('INSERT INTO barcoderesult (productid, xmlname) VALUES ($1, $2)', [barcodeData, xmlname], function (err, result)
				{
					done ();
					if (err)
					{
						console.log("Error : " + err);
						return;
					} else {
						console.log("Insertion successfull !");
					}
				});	
			});

			// DB thread : Retrun data of the matched barcode.

			/*pg.connect (global.database, function (err, client, done)
			{
				client.query ('SELECT * FROM barcodeInfo WHERE productid = $1', [barcodeData], function (err, result)
				{
					done ();
					if (err)
					{
						return;
					}

					if (result.rows.length > 0){
						answer.data = result.rows;
					}
					answer.message = "get successfull"
				});	
			});
			response.send (answer);*/
			response.send ({"result":"ok"});
		}
	} else {
		if(request.files.icu == undefined || request.files.icu == null || request.files.icu == "" || request.files.icu == {}){
			response.send({"result":"error", "message":"No image found"});
			return;
		} else {
			// shell exec : image to xml - extractor.sh with image path parameter.
			function puts(error, stdout, stderr) { sys.puts(stdout) }
			exec("ls -la", function(error, stdout, stderr){
			  if (!error) {
			    // things worked!
			    console.log("Worked !");
			    console.log("output" + stdout);
			  } else {
			    // things failed :(
			    console.log("Didnot worked!");
				return;
			  }
			});

			// DB thread: Get all the image paths in to an Array

			// Shell exec : compare the xml one by one.
			var xmlname = request.files.icu.originalname;

			// check if MATCH.txt found in each loop.
			
			// DB thread : match found get the name of the xml and get the barcode.

			// DB thread : get the details of the barcode.
			response.send({"result":"OK"});
		}
	}
});


app.post('/image', function (request, response){
	console.log("Upload Success !" + JSON.stringify(request.files));
	console.log("Upload Success !" + JSON.stringify(request.body));
	var recordid = request.body.recordid;
	var answer = {};
	var newpath = "upload/" + recordid + ".png";
	console.log("New name : " + newpath);
	fs.rename(request.files.icu.path, newpath, function(err){
		if (err) throw err;
	});
	pg.connect (global.database, function (err, client, done)
	{
		client.query ('update healthdata set image=$1 where recordid=$2', [newpath, recordid], function (err, result)
		{
			done ();
			if (err)
			{	console.log("err : " + err);
				answer.result = "error";
				answer.message = err;
				return;
			}
			console.log("Done");
			answer.result = "ok";
			answer.message = "Insert successfull";
		});	
	});
	answer.result = "ok";
	answer.message = "Insert successfull";
	response.send (answer);
});

/* Main REST interface handler {{{1 */
app.post ('/interface', function (request, response)
{
	var callPush = false;
	var systolicOutOfRange = false;
	var diastolicOutOfRange = false;
	try
	{	console.log("Ineset data : " + request.body.toString());
		console.log("Ineset data : " + JSON.stringify(request.body));
		if (!('operation' in request.body))
			throw 'Missing parameter: operation';

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
app.get ('/', basicAuth, function (request, response){
	response.redirect ('services');
});

// Render services page
app.get ('/services', basicAuth, function (request, response, next){
	response.render ('services', {pretty: true});
});

app.get('/callServices', basicAuth, function (request, response, next){
	response.render('callServices',{pretty: true, id: request.query.id});
});

app.get('/callBarcodeService', basicAuth, function (request, response, next){
	response.render('callBarcodeService',{pretty: true, id: request.query.id});
});

app.get('/displaySummary', basicAuth, function (request, response, next){
	response.render('displaySummary',{pretty: true});
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
