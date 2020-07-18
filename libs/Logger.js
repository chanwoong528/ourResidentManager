var mongoose = require('mongoose');
var Chat = require('../models/Chat');
var User = require('../models/User');
var escapeUtil = require('./escapeUtil');
var dateUtil = require('./dateUtil');
var mustache = require('mustache');

var Logger = function() {
  // logMap looks like this:
  // {
  //   yourChatId:[
  //     {username:"donkim1212", msg:"Hello, world!", date:1232131},
  //     {username:"moon528", msg:"foo, bar", date:1232132},
  //     ...
  //   ],
  //   anotherChatId:[
  //     ...
  //   ]
  //   ...
  // }
};
Logger.prototype.logMap = {}; // {chatId:[{username, msg, date},]}
Logger.prototype.chatListsByUser = {}; // {username:{target:chatId,}}

Logger.prototype.init = async function() {
  try {
    var chats = await Chat.find({}).exec();
    chats.forEach((chat, i) => {
      Logger.prototype.track(chat);
    });
  } catch (err) {
    err.stack;
  }
}

Logger.prototype.getChatList = function(username) {
  if (!Logger.prototype.chatListsByUser[username]) {
    Logger.prototype.getChatId(username); // this refreshes chatListByUser[username]
  }
  var data = Logger.prototype.chatListsByUser[username]; // {target:chatId, ...}
  var ret = '';
  for (var target in data) {
    var target_username = target;
    var chatId = data[target];
    var log = Logger.prototype.getLastLog(chatId); // {msg, date, stamp}

    // TODO: sort chat list (chat w/ most recent msg loads first)

    ret += Logger.prototype.buildChatList(target_username, log.msg, log.date);

  }
  return ret;
}



Logger.prototype.getChatId = async function(username, target) {
  var chatId = '';
  console.log(!Logger.prototype.chatListsByUser[username]);
  if (!Logger.prototype.chatListsByUser[username]) {
    try {
      var chats = await Chat.find({ users: { $all: [username] } }).exec();
      chats.forEach((chat, i) => {
        Logger.prototype.track(chat);
        if (chat.users.includes(username) && chat.users.includes(target)) {
          chatId = chat._id.toString();
        }
      });
      return chatId;
    } catch (err) {
      err.stack;
      return '';
    }
  } else if (!Logger.prototype.chatListsByUser[username][target]) {
    try {
      var chat = await Chat.findOne({ users: { $all: [username, target] } }).exec();
      if (chat) {
        Logger.prototype.track(chat);
        chatId = chat._id.toString();
        return chatId;
      }
    } catch (err) {
      err.stack;
      return '';
    }

  } else {
    chatId = Logger.prototype.chatListsByUser[username][target];
  }
  return chatId;
}

Logger.prototype.track = function(chat) {
  var chatId = chat._id.toString();
  var user1 = chat.users[0];
  var user2 = chat.users[1];
  // var log = chat.log;
  if (!Logger.prototype.logMap[chatId]) {
    Logger.prototype.logMap[chatId] = new Array();
    // if (log) { // add log to logMap }
  }
  if (!Logger.prototype.chatListsByUser[user1]) {
    Logger.prototype.chatListsByUser[user1] = {};
  }
  Logger.prototype.chatListsByUser[user1][user2] = chatId;
  if (!Logger.prototype.chatListsByUser[user2]) {
    Logger.prototype.chatListsByUser[user2] = {};
  }
  Logger.prototype.chatListsByUser[user2][user1] = chatId;
};

Logger.prototype.getRecentLog = function(chatId, username, target, quantity) {
  if (!chatId && (!username || !target)) return -1;
  var qty = quantity ? quantity : 50;
  var cid = chatId ? chatId : Logger.prototype.getChatId(username, target);
  if (cid == '') return 0;
  var logEntry = Logger.prototype.logMap[cid];
  var log = '';
  if (logEntry != null && logEntry !== undefined) {
    var start = logEntry.length - 1;
    var until = start - qty;
    var end = until > 0 ? until : 0;
    for (var i = start; i >= end; i--) {
      isMyMsg = logEntry[i].username == username;
      // starting from most recent, prepend
      log = Logger.prototype.buildMessage(logEntry[i].username, logEntry[i].msg, logEntry[i].date, isMyMsg) + log;
    }
  }
  return log;
}

Logger.prototype.getLastLog = function(chatId, fromDB) {
  if (Logger.prototype.logMap[chatId]) {
    var data = Logger.prototype.logMap[chatId][Logger.prototype.logMap[chatId].length - 1];
    return data ? { msg: data.msg, date: data.date, stamp: dateUtil.getDateAsString(data.date) } : -1;
  }
  return -1;
}

Logger.prototype.addLogToChat = function(chatId, username, msg, date) {
  var log = { username: username, msg: msg, date: date };
  Logger.prototype.checkLogMapFor(chatId);
  Logger.prototype.logMap[chatId].push(log);
  return log;
}

Logger.prototype.checkLogMapFor = function(chatId) {
  if (!Logger.prototype.logMap[chatId]) {
    Logger.prototype.logMap[chatId] = new Array();
  }
}

/**
 * @deprecated
 */
Logger.prototype.getLog = function(chatId, fromDB, username) {
  if (!username) return Logger.prototype.logMap[chatId] === undefined ? -1 : Logger.prototype.logMap[chatId];
  var logEntry = Logger.prototype.logMap[chatId];
  var log = '';
  if (logEntry != null && logEntry !== undefined) {
    logEntry.forEach((item, i) => {
      isMyMsg = item.username == username;
      log += Logger.prototype.buildMessage(item.username, item.msg, item.date, isMyMsg);
      // log += ;
    });
  }
  return log;
}



Logger.prototype.buildMessage = function(username, msg, date, isMyMsg) {
  var built = '';
  var n = username;
  var m = escapeUtil.escape(msg);
  var d = escapeUtil.escape(dateUtil.getDateAsString(date));
  built += isMyMsg ?
    `<div class="outgoing_msg"><div class="sent_msg">` :
    `<div class="incoming_msg"><div class="received_msg"><div class="received_withd_msg">`;
  built += `<p>`;
  built += m;
  built += `</p><span class="time_date">`;
  built += d;
  built += `</span></div></div>`;
  built += isMyMsg ? `` : `</div>`;
  return built;
}

Logger.prototype.buildChatList = function(username, msg, date) {
  var built = '';
  var n = username;
  var m = msg ? escapeUtil.escape(msg) : '';
  var d = date ? escapeUtil.escape(dateUtil.getDateAsString(date)) : '';
  built += `<div id="`;
  built += n;
  built += `" class="chat_list" style="cursor: pointer;" onclick="loadChatBySelection(this)">`;
  built += `<div class="chat_people">`;
  built += `<div class="chat_img"> <img src="https://ptetutorials.com/images/user-profile.png" alt="sunil"> </div>`;
  built += `<div class="chat_ib"><h5>`;
  built += n;
  built += `<span class="chat_date">`;
  built += d ? d : ``;
  built += `</span></h5><p>`;
  built += m ? m : ``;
  built += `</p></div></div></div>`;
  return built;
}

/**
 * @WIP mustache template message
 */
Logger.prototype.builtTmplMessage = function(data, mine) {
  var item = {
    "msg": escapeUtil.escape(data.msg),
    "date": escapeUtil.escape(dateUtil.getDateAsString(data.date))
  }
  var template = mine ?
    `<div class="outgoing_msg"><div class="sent_msg">` :
    `<div class="incoming_msg"><div class="received_msg"><div class="received_withd_msg">`;
  template += `<p>{{item.msg}}</p><span class="time_date">{{item.date}}</span></div></div>`;
  if (!mine) template += `</div>`;
  return '';
}

module.exports = Logger;
