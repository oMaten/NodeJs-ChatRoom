$(function($){
	var socket = io.connect();

	var errorUserInfo = {
		0: '用户不存在',
		1: '密码不正确',
		2: '用户名已存在',
		3: '二次输入密码不正确',
		4: '信息不完整',
	};

	function afterAuth(data, errorMsg){
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
			alert(errorUserInfo[errorMsg]);
		}
	}

	function scrollBottom(){
		var h = $('.chat-block > ul').height() - $('.chat-block').height();
		$('.chat-block').scrollTop(h);
	}

	function formReset(remove, add){
		$('.signup-form').off("submit");
		$('.signin-form').off("submit");
		$('.form-wrapper').removeClass(remove).addClass(add);
	}

	function formSubmit(event){
		event.preventDefault();
		if(event.target.className.indexOf(event.data.formName)!= -1){
			var userInfo = {};
			switch(event.data.formName){
				case 'signin':
					userInfo = {
						username: $('.username').val(),
						password: $('.password').val()
					};
					break;
				case 'signup':
					userInfo = {
						username: $('.username').val(),
						password: $('.password').val(),
						repassword: $('.repassword').val()
					};
					break;
			}
			socket.emit(event.data.formName, userInfo, afterAuth);
		}
	}

	$('.signin-form').on("submit", {'formName': 'signin'}, formSubmit);

	$('#signin').on('click', function(){
		formReset('signup-form', 'signin-form');
		$('.signin-form').on("submit", {'formName': 'signin'}, formSubmit);
	});

	$('#signup').on('click', function(){
		formReset('signin-form', 'signup-form');
		$('.signup-form').on("submit", {'formName': 'signup'}, formSubmit);
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