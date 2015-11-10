var mongoose = require('mongoose'),
	bcrypt = require('bcrypt'),
	Promise = require('bluebird'),
	SALT_WORK_FACTOR = 10;

var userSchema = mongoose.Schema({
	username: { type: String, require: true, index: { unique: true } },
	password: { type: String, require: true },
	created: { type: Date, default: Date.now }
});

userSchema.statics.failedReason = {
	NOT_FOUND: 0,
	PASSWORD_INCORRECT: 1,
	USER_HAS_EXISTED: 2,
};

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
	var _this = this;
	return this.findOneAsync({ username: data.username })
		.then(function(user){
			return [ data, user ];
		})
		.error(function(error){
			console.error(error.message);
		});
};

userSchema.statics.passwordCompare = function(data, user){
	var _this = this;

	if(user === null){
		throw new Error(_this.failedReason.NOT_FOUND);
	}else{
		return bcrypt.compareAsync(data.password, user.password)
			.then(function(res){
				if(res){
					return user;
				}else{
					throw new Error(_this.failedReason.PASSWORD_INCORRECT);
				}
			})
			.error(function(error){
				console.error(error.message);
			});
	}
};

userSchema.statics.signup = function(data){
	var _this = this;
	return this.findUser(data)
		.spread(function(data, user){
			if(!user){
				return _this.passwordSalt(data);
			}else{
				throw new Error(_this.failedReason.USER_HAS_EXISTED);
			}
		})
		.then(function(data){
			return _this.saveUser(data);
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