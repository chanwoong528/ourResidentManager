var express = require('express');
var router = express.Router();
var Chat = require('../models/Chat');
var User = require('../models/User');
var util = require('../util');

// Index
router.get('/', util.isLoggedin, function(req, res) {
  //console.log(req.url);
  res.render('dm/index');
});

// Show Chatroom
router.get('/:username', util.isLoggedin, function(req, res) {
  var chats = req.user.activeChats;
  if (chats){
    chats.forEach(element => function() {
      if (!(element.target > req.params.username) && !(element.target < req.params.username)) {
        var id = element.id.toString();
        var log;
        Chat.findOne({
          _id: element.id
        }, function(err, chat) {
          if (err) return res.json(err);
          log = chat.log;
        });
        return res.render('dm/chat', {
          id: id,
          log: log
        });
      }
    });
  }
  
  var chat = Chat.create();
  User.aggregate([{
      $match: {
        _id: req.user._id
      }
    },
    {
      $addToSet: {
        activeChats: {
          target: req.params.username,
          id: chat._id
        }
      }
    }
  ]);
  User.aggregate([{
      '$match': {
        'username': req.params.username
      }
    },
    {
      '$addToSet': {
        'activeChats': {
          'target': req.user._id,
          'id': chat._id
        }
      }
    }
  ]);
  return res.render('dm/chat', {
    id: chat._id
  });
});

module.exports = router;
