var express = require('express');
var router = express.Router();
var Chat = require('../models/Chat');
var util = require('../util');
var User = require('../models/User');

// Index
router.get('/', util.isLoggedin, function(req, res)
{
  var chats = req.user.activeChat;
  var targets = [];
  if (chats)
  {
    chats.forEach(element => function()
    {
      targets.push(element.target);
    });

    res.render('dm/index', {targets:targets});
  }
res.render('dm/index', {targets:targets});
});

// Chat
router.get('/:username', util.isLoggedin, function(req, res) {
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
  // User.findOne({
  //   username: user2
  // },function(err,user){
  //   if (err) return console.log(err);
  //   if (!user){
  //     // invalid username
  //     console.log(' @routes/chats.js // invalid username');
  //     return res.redirect('/dm');
  //   }
  // });
  Chat.findOneByUsernames(user1,user2,function(err,chat){
    if (err) return console.log(err);
    var log = chat.getLogAsString();
    res.render('dm/chat',{
      chatId:chat._id.toString(),
      users:chat.users,
      log:log
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
