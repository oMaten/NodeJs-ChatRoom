var express = require('express');
var path = require('path');
var app = express();
var jade = require('jade');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var sassMiddleware = require('node-sass-middleware');
var mongoose = require('mongoose');
var moment = require('moment');
var Chat = require('./model/chat');
var User = require('./model/user');
var Promise = require('bluebird');

var users = {};

server.listen(3000);

mongoose.connect('mongodb://localhost/chat', function(error){
	if(error){
		console.log(error);
	}else{
		console.log('MongoDB has already connected..');
	}
});

io.sockets.on('connection', function(socket){

	socket.on('signup', function(data, callback){
		if(data.password && data.repassword && data.username){
			if(data.password !== data.repassword){
				return callback(false);
			}
		}else{
			return callback(false);
		}
		User.signup(data)
			.then(function(data){
				if(data){
					socket.user = data;
					users[socket.user.username] = socket;
					var template = jade.renderFile('views/chat.jade', {'username': data.username});
					callback(template);
				}else{
					return callback(data);
				}
			})
			.finally(function(){
				updateUsers();
			})
			.error(function(error){
				console.error(error.message);
			});
	});

	socket.on('signin', function(data, callback){

		if(!data.password || !data.username){
			return callback(false);
		}
		var _template = '';

		User.signin(data)
			.then(function(user){
				if(user){
					socket.user = user;
					users[socket.user.username] = socket;
					var template = jade.renderFile('views/chat.jade', {'username': user.username});
					callback(template);
					updateUsers();
				}else{
					return callback(false);
				}
			})
			.then(function(){
				return Chat.findNewMessage(5)
					.then(function(docs){
						return docs;
					});
			})
			.each(function(doc, index, length){
				date = moment(doc.created).format('YYYY-MM-DD HH:mm');
				if(doc.username == socket.user.username){
					_template += jade.renderFile('views/messageMe.jade', {'message': doc.message, 'username': doc.username, 'date': date});
				}else{
					_template += jade.renderFile('views/message.jade', {'message': doc.message, 'username': doc.username, 'date': date});
				}
				return _template;
			})
			.then(function(template){
				socket.emit('load messages', _template);
			})
			.error(function(error){
				console.error(error.message);
			});

	});
	function updateUsers(){
		var userList = Object.keys(users);
		var template = '';
		for(var i=0,l=userList.length;i<l;i++){
			template += jade.renderFile('views/user.jade', {'username': userList[i]});
		}
		io.sockets.emit('updateUsers', template);
	}

	socket.on('send message', function(data, callback){
		var message = data.trim();
		if(message.substr(0,2) === '@ '){
			message = message.substr(2);
			if(message.indexOf(' ') !== -1){
				var name = message.substring(0, message.indexOf(' '));
				var whispermessage = message.substring(message.indexOf(' ')+1);
				if(name in users){
					users[name].emit('whisper', {
						message: whispermessage,
						nickname: socket.nickname
					});
					console.log('message is' + message);
				}
			}
			else{
				callback(false);
			}
		}
		else{

			if(!socket.user || !message){
				callback(false);
			}

			Chat.sendMessage(message)
				.then(function(data){
					var date = moment(data.created).format('YYYY-MM-DD HH:mm');
					var template = jade.renderFile('views/message.jade', {'message': data.message, 'username': data.username, 'date': date});
					var _template = jade.renderFile('views/messageMe.jade', {'message': data.message, 'username': data.username, 'date': date});
					socket.broadcast.emit('new message', template);
					callback(_template);
				})
				.error(function(error){
					console.error(error.message);
				});
		}
	});

	socket.on('disconnect', function(data){
		if(!socket.user){
			return;
		}
		delete users[socket.user.username];
		updateUsers();
	});
});


app.set('views', __dirname + '/views');
app.set('view engine', 'jade');


app.use(
	sassMiddleware({
		src: __dirname + '/scss',
		dest: __dirname + '/css',
		debug: true,
		outputStyle: 'nested'
	})
);


app.use(express.static('js'));
app.use(express.static('css'));
app.use(express.static('image'));
app.use(express.static('font-awesome-4.4.0'));

app.get('/', function(req, res){
	res.render('index');
	res.end();
});



console.log('Server is running now');