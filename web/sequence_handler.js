var events = require ('events');
var vm = require ('vm');
var needle = require ('needle');

function Test (id)
{
	this.id = id;
	console.log (id);

	this.submit = function ()
	{
		console.log ('Submitting test ' + this.id);

		needle.post (global.local_url, {operation: 'submit_test', id: this.id, description: 'Submit from vm'}, {}, function (err, response)
		{
			console.log (response.body.result);
		});
	};
}

function Handler ()
{
	events.EventEmitter.call (this);

	this.handle = function (query, answer)
	{
		var self = this;

		var code = query.code;
		var sandbox = {mytest: Test};
		vm.runInNewContext (code, sandbox);

		self.emit ('done', null, answer);
	};
};

Handler.prototype = Object.create (events.EventEmitter.prototype);

exports.createHandler = function()
{
	return new Handler();
};
