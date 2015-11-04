var mongoose = require('mongoose');
var moment = require('moment');

var chatSchema = mongoose.Schema({
	username: String,
	message: String,
	created: { type: Date, default: Date.now }
});

var Chat = mongoose.model('Message', chatSchema);

module.exports = Chat;