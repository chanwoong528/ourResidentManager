// Chat server
var Chat = require('../models/Chat');
var User = require('../models/User');
var Logger = require('./Logger');
var logger = new Logger();
var socketio = require('socket.io');
var kg = require('../libs/keygen');

var online_users = {}; // {username:{socket.id: chatId}} // user with socket.id currently in 'chatId' room
var passKey = {}; // {username:key} // user's current passKey
var chatRef = {}; // {username:{index:chatId,}}

var notify = {}; // {username:boolean}

module.exports.newPassKey = function(username) {
  var key = kg.generateKey() || ' %%% this is a temporary key for ' + username;
  passKey[username] = key;
  console.log(' **** passKey for [' + username + ']: ' + passKey[username]);
  return key;
}

module.exports.getPassKey = function(username) {
  if (!passKey[username]) addPassKey(username);
  return passKey[username];
}

function check_key(v, m) {
  var val = '';
  for (var key in m) {
    if (m[key] == v)
      val = key;
  }
  return val;
}

logger.init();

module.exports.listen = function(server) {
  io = socketio.listen(server);

  io.on('connection', function(socket) {
    socket.on('notification init', function(username) {
      if (username) {
        addSocketInfo(socket, 'notification', username);
        checkNotification(socket);
      } else { // if no username
        socket.disconnect(true);
      }
    });

    socket.on('chat init', async function(username, target, pk) {
      if (!username || !pk || !target || !passKey[username] || passKey[username] != pk) {
        console.log('cinit, username: ' + username + '\npk | passKey[username]: ' + pk + ' | ' + passKey[username]);
        socket.emit('redirect');
        socket.disconnect(true);
      } else { // params are valid
        var chatId = await logger.getChatId(username, target);
        if (chatId == '') { // no chatId, could be invalid approach
          socket.emit('redirect');
          socket.disconnect(true);
        } else { // found chatId, add socket info
          socket.emit('chat init');
          addSocketInfo(socket, chatId, username, target);

          var recentLog = logger.getRecentLog(chatId, username, target, 30);
          recentLog != -1 ? socket.emit('load log', { recentLog }) : console.log('No recent log for ' + chatId);
        }
      }
    });

    socket.on('request chat list', function(username, pk) {
      if (!passKey[socket.username] || !pk || passKey[socket.username] != pk) {
        // invalid approach, disconnect
        console.log('rcl, username: ' + socket.username + '\npk | passKey[socket.username]: ' + pk + ' | ' + passKey[socket.username]);

        socket.emit('redirect');
        socket.disconnect(true);
      } else {
        var list = logger.getChatList(username);
        socket.emit('receive chat list', { list });
      }

    });

    socket.on('send message', function(data, pk) {
      // data validation
      if (!passKey[socket.username] || !pk || passKey[socket.username] != pk) {
        // invalid approach, disconnect
        console.log('sm, username: ' + socket.username + '\npk | passKey[socket.username]: ' + pk + ' | ' + passKey[socket.username]);

        socket.emit('redirect');
        socket.disconnect(true);
      } else {
        // set data's date-time to current time
        data.date = Date.now();

        var cid = online_users[socket.username][socket.id];
        console.log('cid?? ' + cid);

        // add data to log
        var retLog = logger.addLogToChat(cid, data);
        if (retLog) { // if successful
          // for & send messages as html tags
          myMsg = logger.buildMessage(data, true);
          socket.emit('receive msg', myMsg);

          // let others in chatroom be notified
          notifyAll(cid, data.username);

          yourMsg = logger.buildMessage(data, false);
          socket.to(cid).emit('receive msg', yourMsg);

          // update the chat list for clients
          updateChatList(socket, cid, data);

        } else { // if unsuccessful, receive error message
          socket.emit('error message');
        }
      }

    });

    socket.on('clear notification', function() {
      notify[socket.username] = false;
    });

    socket.on('disconnect', function() {
      var chatId = removeSocketInfo(socket);
      console.log('[' + socket.username + '] disconnected from ' + chatId + '.');

      // var chatId = logger.getChatId(socket.id);
      // io.in(chatId).emit('system message', 'SYSTEM: A user disconnected.');
      // var localLog = logger.socketIdExpired(socket.id);
      // console.log(' log socket EXPIRED, returned local log: ' + localLog);
    });

    socket.on('end chat', function(chatId) {
      console.log(' flushing ', chatId);
      // close room, flush logger's log, and send it to DB.
    });
  });

  function addSocketInfo(socket, chatId, username, target) {
    // console.log('addSocketInfo triggered');
    socket.username = username;
    var item = {};
    item[socket.id] = chatId;
    if (online_users[username]) {
      for (var sid in online_users[username]) {
        // leave current room
        var cid = online_users[username][sid];
        socket.leave(cid);
      }
    }
    online_users[username] = item;
    socket.join(chatId);
  }

  /**
   * @returns {string} chatId
   */
  function removeSocketInfo(socket) {
    // remove entry from online_users
    var username = socket.username;
    var sid = socket.id;
    var chatId = '';
    if (username) {
      if (online_users[username]){
        chatId = online_users[username][sid];
        delete online_users[username];
      }
    }
    return chatId;
  }

  async function updateChatList(socket, cid, data){
    updated = logger.getLatestMsg(cid, data);
    console.log(' updated msg: ');
    console.log(updated);
    socket.emit('update chat list', updated.target, updated.msg, updated.date);
    socket.to(cid).emit('update chat list', updated.username, updated.msg, updated.date);
  }

  function notifyAll (chatId, username){
    var members = logger.getChatMembers(chatId,username);
    if (members){
      members.forEach((member, i) => {
        if (member != username){
          var sid = check_key('notification', online_users[member]);
          notify[member] = true;
          if (sid != '') io.to(sid).emit('receive notification');
        }
      });

    }
  }

  function checkNotification(socket) {
    var state = notify[socket.username];
    console.log('[' + socket.username + ']' + '\'s notification, status : ' + state);
    if (state === true) {
      // console.log('should receive notification');
      socket.emit('receive notification');
    } else if (state === undefined) {
      // create one with false
      notify[socket.username] = false;
    } // ignore when false
  }
}
