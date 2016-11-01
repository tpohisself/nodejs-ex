var mongoose = require("mongoose")
,bcrypt = require('bcrypt-nodejs');

var accountSchema = new mongoose.Schema({
  username:{
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  email: String,
  blocked:{
    type: Boolean,
    default: false
  },
  IPS:[String],
  role:{
    type: String,
    default: 'user'
  }
});

accountSchema.pre('save', function(cb) {
  var user = this;
  if (!user.isModified('password')) return cb();
  bcrypt.genSalt(5, function(err, salt) {
    if (err) return cb(err);
    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return cb(err);
      user.password = hash;
      cb();
    });
  });
});

accountSchema.methods.verifyPassword = function(password, cb) {
  bcrypt.compare(password, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};
module.exports = mongoose.model("account", accountSchema);
