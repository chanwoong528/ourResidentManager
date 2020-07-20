var express = require('express');
var router = express.Router();
var Chat = require('../models/Chat');
var util = require('../util');
var User = require('../models/User');
var socketio = require('../libs/socket-listener');
var Logger = require('../libs/Logger');
var logger = new Logger();

// Index
router.get('/', util.isLoggedin, function(req, res){
  var user1 = req.user.username;
  var passKey = socketio.newPassKey(user1);

  res.render('dm/index',{
    passKey: passKey
  });
});

router.get('/:username', util.isLoggedin, function(req, res) {
  var user1 = req.user.username;
  var user2 = req.params.username;
  if (user1 == user2) return res.redirect('/');
  User.findOneByUsername(user2, function (err, user){
    if (err) return console.log(err);
    if (!user){
      // invalid username
      console.log(' @routes/chats.js // invalid username');
      return res.redirect('/');
    }
  });
  Chat.findOneByUsernames(user1,user2,function(err,chat){
    if (err) return console.log(err);
    console.log('findOne chat._id.toString() : ' + chat._id.toString());
    logger.track(chat);
    var passKey = socketio.newPassKey(user1);
    res.render('dm/index',{
      target:user2,
      passKey:passKey,
    });
  });


});

// Chat
router.get('/:username/temp', util.isLoggedin, function(req, res) {
  var user1 = req.user.username;
  var user2 = req.params.username;
  if (user1 == user2) return res.redirect('/dm');
  User.findOneByUsername(user2, function (err, user){
    if (err) return console.log(err);
    if (!user){
      // invalid username
      console.log(' @routes/chats.js // invalid username');
      return res.redirect('/dm');
    }
  });
  Chat.findOneByUsernames(user1,user2,function(err,chat){
    if (err) return console.log(err);
    console.log('findOne chat._id.toString() : ' + chat._id.toString());
    res.render('dm/chat',{
      chatId:chat._id.toString(),
      users:chat.users
    });
  });
});

// SHOW
router.get('/:username/show', util.isLoggedin, function(req, res) {
  var user1 = req.user.username;
  var user2 = req.params.username;
  if (user1 == user2) return res.redirect('/dm');
  User.findOne({
    username: user2
  }, function (err, user){
    if (err) return console.log(err);
    if (user){
      // found a matching user, validation success
      Chat.findOneByUsernames(user1,user2,function(err,chat){
        if(err) return console.log(err);
        return res.redirect('/dm/' + user2);
      });
    }
    else {
      // no matching user, return to home
      return res.redirect('/dm');
    }
  });
});

module.exports = router;
