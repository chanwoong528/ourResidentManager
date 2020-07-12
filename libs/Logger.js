var mongoose = require('mongoose');
var Chat = require('../models/Chat');
var User = require('../models/User');

var Logger = function() {
  // data[0] == (String) chatId
  // data[1] == (Array) logEntry
  //  data[1][n] == (String) username, (String) msg, (Date) stamp
  // data[2..n] == (socket.id) socketId
};
Logger.prototype.log = new Array();

/**
 * @param id Chat model's _id in String, or socket.io's socket id
 * @returns A temporarily log entry for a chatroom saved in the server (not in DB).
 *          Will return -1 if there was no match, and there was no ID given.
 */
Logger.prototype.getData = function(id) {
  // var id = (typeof id == 'string') ? chatId : socketId;
  // if (!id) return -1;
  var data = Logger.prototype.log.find(e => e.includes(id));
  return data === undefined ? -1 : data;
}

Logger.prototype.init = function(socketId, chatId) {
  console.log('#### chatID #### \n' + chatId);
  var data = Logger.prototype.loadDBLog(chatId);
  console.log(' ######## DB Log ############ \n' + data);
  if (data == 0 || data == -1) {
    var set = [chatId, new Array(), socketId];
    Logger.prototype.log.push(set);
    return set[1];
  } else {
    if (!data.includes(socketId)) data.push(socketId);
    return data[1];
  }
}

Logger.prototype.loadDBLog = function (chatId){
  // var arr = Chat.aggregate([{$match:{_id:mongoose.Types.ObjectId(chatId)}},
  // {$project:{_id:0,log:{$slice:["$log",-100]}}},{$unwind:{path:"$log"}}]);
  // console.log('aggregation pipeline????');
  // console.log(arr);
  Chat.findOneByChatIdString(chatId,function(err, chat){
    if (err) {
      console.log(err);
      return -1;
    }
    if (chat) {
      var arr = chat.getLog();
      console.log('chat log obtained: ' + arr);
    }
  });
  // return arr?arr:-1;
}

/**
 * @param id is either {String} chatId or {socket.id} socketId
 * @param {String} username User model's username
 * @param {String} msg sent message
 * @param {Date} stamp
 * @returns {Array} set, the log just saved to the log array
 */
Logger.prototype.appendLog = function(id, username, msg, stamp) {
  var data = Logger.prototype.getData(id);
  var set = [username, msg, stamp];
  data[1].push([username, msg, stamp]);
  return set;
}

/**
* Find chatId w/ given socketId
*/
Logger.prototype.getChatId = function(socketId) {
  var data = Logger.prototype.getData(socketId);
  return data[0];
}

Logger.prototype.getLogArray = function(chatId) {
  var data = Logger.prototype.getData(chatId);
  return data[1];
}

Logger.prototype.flush = function(data) {
  var ret = data[1];
  data[1] = new Array();
  var chatId = data[0];
  Chat.findOneByChatIdString(chatId, function(err, chat){
    chat.addAllToLog(ret);
  });
  return ret;
}

Logger.prototype.socketIdExpired = function(socketId) {
  var data = Logger.prototype.getData(socketId);
  if (data == -1) {
    console.log(" @Logger: No such data containing socket: " + socketId)
    return -1;
  }
  var i = data.indexOf(socketId);
  data.splice(i, 1);
  return Logger.prototype.flush(data);
}

Logger.prototype.removeChatEnrtybyChatId = function(chatId) {
  // this should be triggered when both users exits chatroom
  // please check above status before using this function
  var data = Logger.prototype.getData(chatId);
  if (data == -1) {
    console.log(" @Logger: No chat entry for: " + chatId);
    return -1;
  }
  var i = Logger.prototype.log.indexOf(data);
  Logger.prototype.log.splice(i, 1);
  return 1;
}

module.exports = Logger;
