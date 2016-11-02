var express = require('express')
,db = require("mongoose")
,chatData = db.model('chat')
,moment = require('moment')
,router = express.Router();

  router.get("/", function(req, res){
    var username = '';
    var role = '';
    if(req.user && req.user.username){
      username = req.user.username;
      role = req.user.role;
    }else{
      username = 'guest';
      role = 'guest';
    }
    // console.log('user is '+username);
    // console.log(req.user);
    var date = moment().subtract(3, 'hours').format('MMMM Do YYYY, h:mm:ss a');
    console.log('date ' +date);
    chatData.find({'Deleted':false,'Timestamp':{'$gte': date}}).populate({ path : "User", select:'username role'})
    .sort({'Timestamp':1}).limit(400).exec(function(e,data){
      if(e) console.error(e);
      var chats =[];
      if(data && data.length >0){
        for(var i=0;i<data.length;i++){
          // console.log('data '+i)
          // console.log(data[i]);
          if(data[i].User.username && data[i].User.username != ''){
            var chat = {
              id: data[i]._id,
              username: data[i].User.username,
              Verbiage: data[i].Verbiage,
              Timestamp: data[i].Timestamp.split(', ')[1] + ' CST'
            };
            chats.push(chat);
          }
        }
      }else{
        console.log('no chat posts found');
      }

      var vm = {
        user: username,
        chats: chats,
        Role: role
      };
      res.render('chat',vm);
    });
  });

  router.post("/deletePost", function (req, res) {
    if(req.user && req.user.username != 'guest' && req.user.username != 'admin'){
      chatData.update({'User':req.user,'_id':req.body.id},{'Deleted':true},function(e,data){
        res.json({msg: req.body.id});
      });
    }else{
      res.json({msg:'No login found.'});
    }
  });

  router.post("/masterDeletePost", function (req, res) {
    if(req.user && req.user.username == 'Hisself' || req.user.username != 'Hisself2'){
      var id = req.body.id;
      chatData.update({'_id':id},{'deleted':true},function(e,data){
        res.json({msg: id});
      });
    }else{
      res.json({msg:'No login found.'});
    }
  });

  module.exports = router;
