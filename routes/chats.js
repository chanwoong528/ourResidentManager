var express = require('express');
var router = express.Router();
var Chat = require('../models/Chat');
var util = require('../util');
var User = require('../models/User');

// Index
router.get('/:username', util.isLoggedin, function(req, res) {
  var user1 = req.user.username;
  var user2 = req.params.username;
  Chat.findOne({
    users:{$all:[user1,user2]}
  }, function(err,chat){
    if (err) return console.log(err);
    var log = chat.log;
    var logString = '';
    var newLine = '\n';
    console.log(' chat.log = ' + chat.log);
    // if (log){
    //   log.foreach(e => function(){
    //     logString += '[' + e.username + '] ' + e.text + ' --' + e.createdAt + newLine;
    //   });
    // }
    res.render('dm/index',{
      chatId:chat._id.toString(),
      users:chat.users,
      log:logString
    });
  });
});

// SHOW
router.get('/:username/show', util.isLoggedin, function(req, res) {
  console.log('@routes/chats.js, req.body.message: ' + req.body.message);
  var user1 = req.user.username;
  var user2 = req.params.username;
  console.log('user1: ' + user1 + ' / user2: ' + user2);
  User.findOne({
    username: user2
  }, function (err, user){
    if (err) return console.log(err);
    if (user){
      // found a matching user, validation success
      console.log('[' + user.username + '] is a valid user!');
      Chat.findOne({
        users:{$all:[user1,user2]}
      }, function(err, chat){
        if (err) return console.log(err);
        if (chat){
          console.log(' chat exists: ' + chat);
          // existing chat found, stringify db log

          return res.redirect('/dm/' + user2);
          // return res.render('dm', {
          //   chatId: chat._id.toString(),
          //   users: chat.users,
          //   log: logString
          // });
        }
        else{
          // no such chat found, need to CREATE
          return res.redirect('/dm/' + req.params.username + '/create');
        }
      });
    }
    else {
      // no matching user, return to home
      console.log('No such user as: ' + user2);
      return res.redirect('/');
    }
  });
});

// CREATE
router.get('/:username/create', util.isLoggedin, function(req, res) {
  var user1 = req.user.username;
  var user2 = req.params.username;
  // user2 has already been verified in SHOW

  Chat.create({users:[user1,user2]}, function(err, chat){
    // {$push:{users:{$each:[user1,user2]}}}
    if (err) return console.log(err);
    console.log('a new chatroom has been created: ' + user1 + ' ' + user2);
    console.log(' chat ==> ' + chat._id.toString() + ' // ' + chat.users);
    return res.redirect('/dm/' + user2 + '/show');
    // return res.render('dm/chat', {
    //   chatId:chat._id.toString(),
    //   users:chat.users,
    //   log:''
    // });
  });
});

module.exports = router;
