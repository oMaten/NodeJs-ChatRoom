var mongoose = require('mongoose'),
	bcrypt = require('bcrypt'),
	Promise = require('bluebird'),
	SALT_WORK_FACTOR = 10;

var userSchema = mongoose.Schema({
	username: { type: String, require: true, index: { unique: true } },
	password: { type: String, require: true },
	created: { type: Date, default: Date.now }
});

userSchema.statics.signin = function(data){
	var _this = this;
	return this.findUser(data)
		.spread(function(data, user){
			return _this.passwordCompare(data, user);
		})
		.error(function(error){
			console.error(error.message);
		});
};

userSchema.statics.findUser = function(data){
	return this.findOneAsync({ username: data.username })
		.then(function(user){
			if(user){
				return [ data, user ];
			}else{
				return [ data, null ];
			}
		})
		.error(function(error){
			console.error(error.message);
		});
};

userSchema.statics.passwordCompare = function(data, user){
	return bcrypt.compareAsync(data.password, user.password)
		.then(function(res){
			if(res){
				return user;
			}else{
				return res;
			}
		})
		.error(function(error){
			console.error(error.message);
		});
};

userSchema.statics.signup = function(data){
	var _this = this;
	return this.findUser(data)
		.spread(function(data, user){
			if(!user){
				return _this.passwordSalt(data);
			}else{
				return false;
			}
		})
		.then(function(data){
			if(data){
				return _this.saveUser(data);
			}else{
				return data;
			}
		})
		.error(function(error){
			console.error(error.message);
		});
};

userSchema.statics.saveUser = function(data){
	var newUser = new User({
		username: data.username,
		password: data.password
	});

	return newUser.saveAsync()
		.then(function(data){
			return data;
		})
		.error(function(error){
			console.error(error.message);
		});
};

userSchema.statics.passwordSalt = function(data){
	return bcrypt.genSaltAsync(SALT_WORK_FACTOR)
		.then(function(salt){
			return bcrypt.hashAsync(data.password, salt)
				.then(function(hash){
					data.password = hash;
					return data;
				})
				.error(function(error){
					console.error(error.message);
				});
		})
		.error(function(error){
			console.error(error.message);
		});
};



var User = mongoose.model('User', userSchema);
Promise.promisifyAll(User);
Promise.promisifyAll(User.prototype);
Promise.promisifyAll(bcrypt);

module.exports = User;