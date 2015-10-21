/*
Request parameters:
None

Answer object:
{
	result: "ok",
	version:
		{major:, minor:}
}
*/

var events = require ('events');

function Handler ()
{
	events.EventEmitter.call (this);

	this.handle = function (query, answer)
	{
		var self = this;

		answer.version = {major: 0, minor: 1};
		self.emit ('done', null, answer);
	};
};

Handler.prototype = Object.create (events.EventEmitter.prototype);

exports.createHandler = function()
{
	return new Handler();
};
