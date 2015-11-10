var mongoose = require('mongoose');
var Promise = require('bluebird');

var chatSchema = mongoose.Schema({
	username: String,
	message: String,
	created: { type: Date, default: Date.now }
});

chatSchema.statics.findNewMessage = function(count){
	return new Promise(function(resolve, reject){
		Chat.find({}).sort('-created').limit(count).exec(function(error, docs){
			if(error){
				reject(error);
			}
			resolve(docs);
		});
	});
};

chatSchema.statics.sendMessage = function(data){
	var newMessage = new Chat({
		username: data.username,
		message: data.message,
	});

	return newMessage.saveAsync()
		.then(function(data){
			return data;
		})
		.error(function(error){
			console.error(error.message);
		});
};

var Chat = mongoose.model('Message', chatSchema);

Promise.promisifyAll(Chat);
Promise.promisifyAll(Chat.prototype);

module.exports = Chat;