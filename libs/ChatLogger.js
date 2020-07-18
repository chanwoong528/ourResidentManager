var mongoose = require('mongoose');
var Chat = require('../models/Chat');
var User = require('../models/User');
var escapeUtil = require('./escapeUtil');
var dateUtil = require('./dateUtil');
var mustache = require('mustache');

ChatLogger.prototype.loggers = {};
ChatLogger.prototype.userChatIdList = {};

var ChatLogger = function(chatId, usernames) {
  this.chatId = chatId;
  this.users = usernames;
  this.users.forEach((user), i) => {
    if (!userChatIdList[user]) {
      userChatIdList[user] = new Array();
    }
    userChatIdList[user].push(this.chatId);
  });
  loggers[this.chatId] = this;
};

ChatLogger.prototype.getLoggerList = function(username){
  if (!username) {
    console.log(' @ChatLogger.prototype.findLogger');
    console.log('  -- invalid [username], returning empty Array.');
    return new Array();
  }
  var retLoggers = new Array();
  ChatLogger.prototype.loggers.forEach((logger), i) => {
    if (logger.includes(username)){
      retLogger.push()
    }
  });

}

ChatLogger.prototype.findLogger = function (chatId){

}

module.exports = ChatLogger;
