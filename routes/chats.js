var express = require('express');
var router = express.Router();
var Chat = require('../models/Chat');
var util = require('../libs/util');
var User = require('../models/User');
var socketio = require('../libs/socket-listener');
var Logger = require('../libs/Logger');
var logger = new Logger();

// Index
router.get('/', util.isLoggedin, function(req, res){
  var user1 = req.user.username;
  var passKey = socketio.newPassKey(user1);

  res.render('dm/index',{
    passKey: passKey,
    target:''
  });
});

router.get('/:username', util.isLoggedin, function(req, res) {
  var user1 = req.user.username;
  var user2 = req.params.username;
  if (!user2 || user2 == '' || user2 == null || user1 == user2) return res.redirect('/');
  User.findOneByUsername(user2, function (err, user){
    if (err) return console.log(err);
    if (!user){
      // invalid username
      console.log(' @routes/chats.js // invalid username');
      return res.redirect('/');
    } else {
      Chat.findOneByUsers(req.user,user,function(err2,chat){
        if (err2) return console.log(err2);
        if (chat){
          console.log('findOne chat._id.toString() : ' + chat._id.toString());
          chat.user_data.forEach((item, i) => {
            chat.usernames.push(item.username);
            chat.nicknames.push(item.nickname);
          });
          chat.save(function(err) {
            if (err) return res.status(500).send('Something went wrong!');
          });
          logger.track(chat);
          var passKey = socketio.newPassKey(user1);
          res.render('dm/index',{
            target:user2,
            passKey:passKey,
          });
        }
      });

    }
  });
});

module.exports = router;

// router.get('/:username', util.isLoggedin, function(req, res) {
//   var user1 = req.user.username;
//   var user2 = req.params.username;
//   if (!user2 || user2 == '' || user2 == null || user1 == user2) return res.redirect('/');
//   User.findOneByUsername(user2, function (err, user){
//     if (err) return console.log(err);
//     if (!user){
//       // invalid username
//       console.log(' @routes/chats.js // invalid username');
//       return res.redirect('/');
//     }
//   });
//
//   Chat.findOneByUsernames(user1,user2,function(err,chat){
//     if (err) return console.log(err);
//     console.log('findOne chat._id.toString() : ' + chat._id.toString());
//     logger.track(chat);
//     var passKey = socketio.newPassKey(user1);
//     res.render('dm/index',{
//       target:user2,
//       passKey:passKey,
//     });
//   });
//
// });
