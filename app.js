var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var app = express();
var jade = require('jade');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var sassMiddleware = require('node-sass-middleware');
var mongoose = require('mongoose');
var moment = require('moment');
var flash = require('connect-flash');
var Chat = require('./model/chat');
var User = require('./model/user');

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
		User.getAuthenticated(data, function(error, data){
			if(error){
				throw error;
			}
			var newUser = new User({
				username: data.username,
				password: data.password
			});
			newUser.save(function(error){
				if(error){
					throw error;
				}
				socket.user = newUser;
				users[socket.user.username] = socket;
				var template = jade.renderFile('views/chat.jade', {'username': newUser.username});
				callback(template);
				updateUsers();
			});
		});
	});

	socket.on('signin', function(data, callback){

		if(!data.password || !data.username){
			return callback(false);
		}

		User.tryToSignin(data, function(error, user){

			if(error){
				throw error;
			}
			if(user){
				socket.user = user;
				users[socket.user.username] = socket;
				var template = jade.renderFile('views/chat.jade', {'username': user.username});
				callback(template);
				updateUsers();
				var query = Chat.find({});
				query.sort('-created').limit(8).exec(function(error, docs){
					if(error){
						throw error;
					}
					var l = docs.length,
						template = '';
					for(var i=l-1;i>=0;i--){
						var date = moment(docs[i].created).format('YYYY-MM-DD HH:mm');
						if(docs[i].username === socket.user.username){
							template += jade.renderFile('views/messageMe.jade', {'message': docs[i].message, 'username': docs[i].username, 'date': date});
						}
						else{
							template += jade.renderFile('views/message.jade', {'message': docs[i].message, 'username': docs[i].username, 'date': date});
						}
					}
					socket.emit('load messages', template);
				});
			}
			else{
				callback(false);
			}
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
		var msg = data.trim();
		if(msg.substr(0,3) === '/w '){
			msg = msg.substr(3);
			if(msg.indexOf(' ') !== -1){
				var name = msg.substring(0, msg.indexOf(' '));
				var whisperMsg = msg.substring(msg.indexOf(' ')+1);
				if(name in users){
					users[name].emit('whisper', {
						message: whisperMsg,
						nickname: socket.nickname
					});
					console.log('message is' + msg);
				}
			}
			else{
				callback(false);
			}
		}
		else{

			if(!socket.user || !msg){
				callback(false);
			}
			var newMessage = new Chat({
				'username': socket.user.username,
				'message': msg
			});
			newMessage.save(function(error){
				if(error){
					throw error;
				}
				var date = moment(newMessage.created).format('YYYY-MM-DD HH:mm');
				var template = jade.renderFile('views/message.jade', {'message': newMessage.message, 'username': newMessage.username, 'date': date});
				var _template = jade.renderFile('views/messageMe.jade', {'message': newMessage.message, 'username': newMessage.username, 'date': date});
				socket.broadcast.emit('new message', template);
				callback(_template);
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