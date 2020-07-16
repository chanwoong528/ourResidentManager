// Chat server
var Chat = require('../models/Chat');
var User = require('../models/User');
var Logger = require('./Logger');
var logger = new Logger();
var socketio = require('socket.io');

var online_users = {}; // {username:{socket.id: chatId}}
var chats = {}; // {chatId:[username]}
var notify = {}; // {username:boolean}

function check_key(v, m) {
  var val = '';
  for (var key in m) {
    if (m[key] == v)
      val = key;
  }
  return val;
}

function initChatList(){
  var proceed = true;
  for (var chat in chats){
    proceed = false;
    break;
  }
  if (proceed){
    console.log(' @ socket-listener, initChatList called');

    logger.getDBChatList(function (err, data){
      console.log('data == == == \n' + data);
      // if (chats != -1){
        data.forEach((chat, i) => {
          var chatId = chat._id.toString();
          var users = new Array();
          chat.users.forEach((user, i) => {
            users.push(user);
          });
          chats[chatId] = users;
        });
      // }
      console.log(chats);
    });

  }
}

initChatList();

module.exports.listen = function(server) {
  io = socketio.listen(server);

  io.on('connection', function(socket) {
    socket.on('socket init', function(roomId, username) {
      if (!roomId || !username) {
        socket.emit('redirect');
      } else {
        addSocketInfo(socket, roomId, username);
        socket.join(roomId);
        if (roomId != 'notification') {
          //  = if this is a chat room
          logger.initLogMap(roomId);
          socket.emit('chat init');

          var log = logger.getLog(roomId, false, socket.username);
          log ? socket.emit('load log', { log }) : console.log('No log for ' + roomId);

        } else {
          // = if this is a notification channel
          checkNotification(socket);
        }
      }

    });
    socket.on('request chat list', function(username) {
      // search DB Chat collection for socket's username
      if (username) {
        Chat.findAllByUsername(username, function(err, chats) {
          if (err) {
            console.log(' ERR @ request chat list (1)');
            console.log(err);
          }
          if (chats) {
            console.log(' DB CHATS : \n' + chats);
            // socket.emit('receive chat list', chats);
            chats.forEach((chat, i) => {
              var data = new Array();
              var chatId = chat._id.toString();
              data.push(chatId);
              chat.users.forEach((user, i) => {
                if (user != username) {
                  data.push(user);
                }
              });
              var item = logger.getLastLog(chatId, false);
              var msg = item != -1?item.msg:null;
              var stamp = item != -1?item.date:null;
              data.push(msg);
              data.push(stamp);
              console.log('data : ' + data);
              // var temp = {name:"you", king:"queen"};
              // socket.emit('receive chat list', {data, temp});
              socket.emit('receive chat list', { data });
            });
          }
        });
      }

    });
    socket.on('send message', function(data) {
      // data validation


      // set data's date-time to current time
      data.date = Date.now();

      // add data to log
      var retLog = logger.addLogToChat(data.chatId, data.username, data.msg, data.date);
      if (retLog) { // if successful
        // for & send messages as html tags
        myMsg = logger.buildMessage(data.username, data.msg, data.date, true);
        socket.emit('receive msg', myMsg);

        // let others in chatroom be notified
        notifyAll (data.chatId, data.username);

        yourMsg = logger.buildMessage(data.username, data.msg, data.date, false);
        socket.to(data.chatId).emit('receive msg', yourMsg);

      } else { // if unsuccessful

      }

    });

    socket.on('clear notification', function(){
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

  function addSocketInfo(socket, chatId, username) {
    // console.log('addSocketInfo triggered');
    socket.username = username;
    var item = {};
    item[socket.id] = chatId;
    online_users[username] = item;
    if (!chats[chatId]) {
      chats[chatId] = new Array();
    }
    if (!chats[chatId].includes(username)) {
      chats[chatId].push(username);
    }
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
      chatId = online_users[username][sid];
      delete online_users[username];
      // var chat = chats[chatId];
      // if (chat){
      //   var i = chats[chatId].indexOf(username);
      //   if (i != -1) chats[chatId].splice(i,1);
      // }

    }
    return chatId;
  }

  function notifyAll(chatId, sentBy) {
    chats[chatId].forEach((user, i) => {
      console.log( '@ notifyAll, chats[chatId] = ' + user);
      if (user != sentBy) {
        // for every user in chat except sender
        notify[user] = true;
        console.log('  -- notify[' + user + '] = ' + notify[user]);
        if (online_users[user]){
          // if this user is online
          var socketId = check_key('notification', online_users[user]);
          if (socketId != '') {
            // if the user is in 'notification' channel,
            io.to(socketId).emit('receive notification');
            console.log(' @ notifyAll, receive notification triggered.');
          }
        }
      }
    });
  }

  function checkNotification (socket){
    var state = notify[socket.username];
    console.log ('should check notification, status : ' + state);
    if (state === true){
      console.log ('should receive notification');
      socket.emit('receive notification');
    } else if (state === undefined) {
      // create one with false
      notify[socket.username] = false;
    } // ignore when false
  }

}
