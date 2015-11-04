$(function($){
	var socket = io.connect();

	function afterAuth(data){
		if(data){
			$('body').html(data);

			$('.message-form').on("submit", function(event){
				event.preventDefault();
				socket.emit("send message", $('#message-content').val(), function(data){
					if(data){
						$('.chat-block > ul').append(data);
						scrollBottom();
					}else{
						console.log('please enter the nickname');
					}
				});
				$('#message-content').val('');
			});

		}else{
			alert('error');
		}
	}

	function scrollBottom(){
		var h = $('.chat-block > ul').height() - $('.chat-block').height();
		$('.chat-block').scrollTop(h);
	}

	$('.signin-form').on("submit", function(event){
		event.preventDefault();
		var userInfo = {
			username: $('.username').val(),
			password: $('.password').val()
		};
		socket.emit("signin", userInfo, afterAuth);

	});

	$('#signin').on('click', function(){
		$('.signup-form').off("submit");
		$('.signin-form').off("submit");
		$(this).parents('form').removeClass('signup-form').addClass('signin-form');

		$('.signin-form').on("submit", function(event){
			event.preventDefault();
			var userInfo = {
				username: $('.username').val(),
				password: $('.password').val()
			};
			socket.emit("signin", userInfo, afterAuth);
		});
	});

	$('#signup').on('click', function(){
		$('.signup-form').off("submit");
		$('.signin-form').off("submit");
		$(this).parents('form').removeClass('signin-form').addClass('signup-form');

		$('.signup-form').on("submit", function(event){
			event.preventDefault();
			var userInfo = {
				username: $('.username').val(),
				password: $('.password').val(),
				repassword: $('.repassword').val()
			};

			socket.emit("signup", userInfo, afterAuth);
		});
	});

	
	socket.on("new message", function(data){
		$('.chat-block > ul').append(data);
		scrollBottom();
	});

	socket.on("whisper", function(data){
		$('.chat').append(data.nickname + ' is whisper to you:' + data.message);
	});

	socket.on("load messages", function(data){
		$('.chat-block > ul').append(data);
		scrollBottom();
	});

	socket.on("updateUsers", function(data){
		var html = data;
		$('.list').html(html);
	});
});