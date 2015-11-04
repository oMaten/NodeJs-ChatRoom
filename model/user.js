var mongoose = require('mongoose'),
	bcrypt = require('bcrypt'),
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

module.exports = User;