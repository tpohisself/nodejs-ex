var express = require('express')
,db = require("mongoose")
,passport = require('passport')
,LocalStrategy = require('passport-local').Strategy
,accountData = db.model('account')
,router = express.Router();

passport.use(new LocalStrategy(function (username, password, done) {
  accountData.findOne({ username: username }, function (err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        user.verifyPassword(password, function (err, isMatch) {
            if(err) return done(err);
            if(isMatch){
              // console.log('user validated. ' );
              // console.log(user);
              return done(null, user);
            }else{
              console.log('user validation failed. ');
              return done(null, false, { message: 'Invalid password' });
            }
        });
    });
}));

  passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
    db.model("account").findById(id, function (err, user) {
        done(err, user);
    });
	});

  router.post("/login", function(req, res, next){
    var user = {
        username: req.body.username,
        password: req.body.password
    };
    passport.authenticate('local', function (err, user, info) {
        if (err) { return next(err) }
        if (!user) {
            req.session.messages = [info.message];
            console.log(info.message);
            res.json({msg:info.message});
        }
        req.logIn(user, function (err) {
            if (err) { return next(err); }
            res.json({msg:2,username:user.username});
        });
    })(req, res, next);
  });

  router.get("/logout", function(req, res){
    req.session.destroy(function(err){
        if(err){
          console.log('Error Logging out of Session: ');
          console.error(err);
        }
        req.logout(function(e){
          if(e){
            console.log('Error Logging out');
            console.error(e);
          }
        });
    })
    res.redirect('/');
  });

  router.post("/register", function(req, res){
    var username =req.body.username;
    accountData.find({'username':username},function(e,account){
      if(e) console.error(e);
      else{
        if(account.length > 0){
          res.json({msg:'Username not available.'});
        }else{
          var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
          var ips = [];
          ips.push(ip);

          var newAccount = new accountData({
            username: username,
            password: req.body.password,
            email: req.body.email,
            IPS: ips
          });

          console.log('save new account...');
          console.log(newAccount);

          newAccount.save(function(err,accountSave){
            if(err){
              console.error(err);
              res.json({msg: 'Unable to register account.'});
            }else{
              // if(accountSave.length > 0)
              //   res.json({msg: 'success'});
              // else
              //   res.json({msg: 'unknown error'});
              // console.log(accountSave);
            }
          });
        }
      }
    });
  });

  module.exports = router;
