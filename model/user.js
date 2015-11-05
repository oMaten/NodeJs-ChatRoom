var mongoose = require('mongoose'),
	bcrypt = require('bcrypt'),
	Promise = require('bluebird'),
	SALT_WORK_FACTOR = 10;

var userSchema = mongoose.Schema({
	username: { type: String, require: true, index: { unique: true } },
	password: { type: String, require: true },
	created: { type: Date, default: Date.now }
});

userSchema.statics.tryToSignin = function(data, callback){

	this.findOne({ username: data.username }, function(error, user){
		if(error){
			callback(error);
		}
		if(user){
			bcrypt.compare(data.password, user.password, function(error, res){
				if(error){
					return callback(error);
				}
				if(res){
					callback(null, user);
				}else{
					callback(null, false);
				}
			});
		}
		else{
			console.log('user is not existed');
		}
	});

};

userSchema.statics.signin = function(data){
	var _this = this;
	this.findUser(data)
		.spread(function(data, user){
			_this.passwordCompare(data, user);
		});
	
};

userSchema.statics.findUser = function(data){
	return this.findOneAsync({ username: data.username })
		.then(function(user){
			return [ data, user ];
		})
		.error(function(error){
			console.error(error.message);
		});
};

userSchema.statics.passwordCompare = function(data, user){
	return bcrypt.compareAsync(data.password, user.password)
		.then(function(res){
			if(res){
				console.log('success!');
			}
		})
		.error(function(error){
			console.error(error.message);
		});
};

userSchema.statics.getAuthenticated = function(data, callback){
	
	this.findOne({ username: data.username }, function(error, user){
		if(error){
			callback(error);
		}
		if(!user){
			bcrypt.genSalt(SALT_WORK_FACTOR, function(error, salt){
				if(error){
					return callback(error);
				}
				bcrypt.hash(data.password, salt, function(error, hash){
					if(error){
						return callback(error);
					}
					data.password = hash;
					console.log(data.password);
					callback(null, data);
				});
			});
		}
		else{
			console.log('user is existed');
		}
	});

};

var User = mongoose.model('User', userSchema);
Promise.promisifyAll(User);
Promise.promisifyAll(User.prototype);
Promise.promisifyAll(bcrypt);

module.exports = User;