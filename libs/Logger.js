var mongoose = require('mongoose');
var Chat = require('../models/Chat');
var User = require('../models/User');

var Logger = function() {
  // data[0] == (String) chatId
  // data[1] == (Array) logEntry
  //  data[1][n] == (String) username, (String) msg, (Date) stamp
  // data[2..n] == (socket.id) socketId
};
Logger.prototype.logMap = {};

Logger.prototype.obtainLog = function (chatId){
  return Logger.prototype.logMap[chatId] === undefined ? -1 : Logger.prototype.logMap[chatId];
}

Logger.prototype.initLogMap = function(chatId) {
  // 1. check if log for chatId already exists
  var entry = Logger.prototype.obtainLog(chatId);
  if (entry == -1){
    Logger.prototype.logMap[chatId] = new Array();
  }
  // 1-1. if yes, check by key(i.e., logMap[chatId]) to access log
  // 1-2. if no, create one with chatId as key, logMap[chatId]
}

Logger.prototype.addLogToChat = function(chatId, username, msg, date){
  var log = {username:username, msg:msg, date:date};
  Logger.prototype.checkLogMapFor(chatId);
  Logger.prototype.logMap[chatId].push(log);
  return log;
}

Logger.prototype.checkLogMapFor = function (chatId){
  if (!Logger.prototype.logMap[chatId]){
    Logger.prototype.logMap[chatId] = new Array();
  }
}

/**
 *
 * from here on
 *
 * @deprecated
 *
 */

Logger.prototype.logs = new Array();


/**
 * @param id Chat model's _id in String, or socket.io's socket id
 * @returns A temporarily log entry for a chatroom saved in the server (not in DB).
 *          Will return -1 if there was no match, and there was no ID given.
 */
Logger.prototype.getEntry = function(chatId) {
  // var id = (typeof id == 'string') ? chatId : socketId;
  // if (!id) return -1;
  if (!Logger.prototype.logs[0]) return -1;
  var entry = Logger.prototype.logs.find(e => e.chatId == chatId);
  // console.log(' Logger getEntry = ' + entry);
  // console.log('  ----- ' + entry.chatId);
  // console.log('  ----- ' + entry.log);
  // console.log('  ----- ' + entry.clients);
  return entry === undefined ? -1 : entry;
}
Logger.prototype.getEntryBySocketId = function(socketId) {
  var entry = Logger.prototype.logs.find(e => e.clients.includes(socketId));
  return entry === undefined ? -1 : entry;
}

Logger.prototype.addLog = function(chatId, log) {
  // data == {(String) chatId, (String) username, (String) msg, (Number) date}
  // console.log(' Logger\\\'s addLog: ' + log);
  // console.log('  ----- ' + chatId);
  // console.log('  ----- ' + log.username);
  // console.log('  ----- ' + log.msg);
  // console.log('  ----- ' + log.date);
  var entry = Logger.prototype.getEntry(chatId);
  if (entry == -1) return -1;
  var set = { "username": log.username, "msg": log.msg, "date": log.date };
  entry.log.push(set);
  return entry.log;
}

Logger.prototype.init = function(chatId, clients) {
  // console.log(' #### chat init  : ' + chatId);
  var entry = Logger.prototype.getEntry(chatId);
  // console.log(' #### local log? : ' + entry);
  // console.log('@@@@@@@@@@@ clients? ' + clients);
  if (entry == 0 || entry == -1) { // Chat with chatId isn't tracked, creat one
    var new_entry = { "chatId": chatId, "log": [], "clients": clients };
    Logger.prototype.logs.push(new_entry);
  } else { // else = if found
    if (clients != []) {
      clients.forEach((client, i) => {
        if (!entry.clients.includes(client)) entry.clients.push(client);
      });
    }
  }
  // if (!entry.clients.includes(socketId)) entry.clients.push(socketId);

  return entry;
}

Logger.prototype.updateClients = function(chatId, clients) {
  var entry = Logger.prototype.getEntry(chatId);
  if (clients != []) {
    if (clients != []) {
      clients.forEach((client, i) => {
        entry.clients.push(client);
      });
    }
  }
}

/**
 * Find chatId w/ given socketId
 */
Logger.prototype.getChatId = function(socketId) {
  var entry = Logger.prototype.getEntryBySocketId(socketId);
  return entry.chatId;
}

Logger.prototype.getLog = function(chatId) {
  var entry = Logger.prototype.getEntry(chatId);
  return entry.log;
}

Logger.prototype.socketIdExpired = function(socketId) {
  Logger.prototype.printConsoleLog(false, false);
  var entry = Logger.prototype.getEntryBySocketId(socketId);
  if (entry == -1) {
    console.log(" @Logger: No such entry containing socket: " + socketId)
    return -1;
  }
  var i = entry.clients.indexOf(socketId);
  entry.clients.splice(i, 1);
  return 1;
}

Logger.prototype.printConsoleLog = function(showLog, showClients) {
  console.log('========= LOGGER LOG =========')
  Logger.prototype.logs.forEach((entry, i) => {
    console.log('-- chatId              : ' + entry.chatId);
    if (showLog) {
      entry.log.forEach((log, j) => {
        console.log('-- log                 : [' + j + ']');
        console.log('------ username        : ' + log.username);
        console.log('------ msg             : ' + log.msg);
        console.log('------ date            : ' + log.date);
      });
    } else {
      console.log('-- # of log            : ' + entry.log.length);
    }
    if (showClients) {
      entry.clients.forEach((client, j) => {
        console.log('-- client [' + j + '] ' + client);
      });
    } else {
      console.log('-- # of clients        : ' + entry.clients.length);
    }


  });

}

Logger.prototype.flush = function(chatId) {
  var entry = Logger.prototype.getEntry(chatId);
  console.log(' @on flush, entry.log: ' + entry.log);
  var log = entry.log;
  entry.log = new Array();
  console.log(' @on flush, log: ' + log.length);

  return log;
}


// NOT WORKING
Logger.prototype.loadDBLog = function(chatId) {
  // var arr = Chat.aggregate([{$match:{_id:mongoose.Types.ObjectId(chatId)}},
  // {$project:{_id:0,log:{$slice:["$log",-100]}}},{$unwind:{path:"$log"}}]);
  // console.log('aggregation pipeline????');
  // console.log(arr);
  console.log(' @loadDBLog');
  Chat.findOneByChatIdString(chatId, function(err, chat) {
    if (err) {
      console.log(err);
      return -1;
    }
    if (chat) {
      var arr = chat.getLog();
      console.log('chat log obtained: ' + arr);
      return arr;
    }
    return -1;
  });
  // return arr?arr:-1;
}

Logger.prototype.sendToDB = function(chatId, log) {
  Chat.findOneByChatIdString(chatId, function(err, chat) {
    // log [{"username":username, "msg":msg, "date":date}]
    // each as String String Number
    if (err) console.log(err);
    if (chat) {
      console.log('FOUND MATCHING CHAT IN DB');
      chat.addAllToLog(log);
      chat.save(function(err) {
        if (err) console.log(err);
      });
    }
  });
}

Logger.prototype.removeChatEnrtybyChatId = function(chatId) {
  // this should be triggered when both users exits chatroom
  // please check above status before using this function
  var entry = Logger.prototype.getEntry(chatId);
  if (entry == -1) {
    console.log(" @Logger: No chat entry for: " + entry);
    return -1;
  }
  var i = Logger.prototype.logs.indexOf(entry);
  Logger.prototype.logs.splice(i, 1);
  return 1;
}

module.exports = Logger;
