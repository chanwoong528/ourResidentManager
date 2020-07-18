// Chat server
var Chat = require('../models/Chat');
var User = require('../models/User');
var Logger = require('./Logger');
var logger = new Logger();
var socketio = require('socket.io');
var kg = require('../libs/keygen');

var online_users = {}; // {username:{socket.id: target (false if notification)}}
var chats = {}; // {chatId:[username]}
var notify = {}; // {username:boolean}
var passKey = {}; // {passKey:username}

module.exports.newPassKey = function(username){
  var key = kg.generateKey() || ' %%% this is a temporary key for ' + username;
  passKey[key] = username;
  console.log (' **** passKey[' + key + '] = ' + passKey[key]);
  return key;
}

module.exports.getPassKey = function(username){
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
    socket.on('socket init', async function(username, key, target) {
      if (!key || !username || passKey[key] != username) {
        socket.emit('redirect');
      } else {
        var roomId = 'notification';
        if (target) {
          cid = await logger.getChatId(username, target);
          if (cid != '') roomId = cid;
        }
        addSocketInfo(socket, roomId, username, target);
        if (roomId != 'notification') {
          //  = if this is a chat room
          socket.emit('chat init');

          var log = await logger.getRecentLog(username, target, 30);
          log ? socket.emit('load log', { log }) : console.log('No log');

        } else {
          // = if this is a notification channel
          checkNotification(socket);
        }
      }

    });

    socket.on('request chat list', function(username, key) {
      // search DB Chat collection for socket's username
      if (username && passKey[username] == key) {
        var targets = logger.getChatList(username);
        if (targets[0]){

        }
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
      console.log('[' + socket.username + '] disconnected.');
    });
  });

  function addSocketInfo(socket, roomId, username, target) {
    // console.log('addSocketInfo triggered');
    socket.username = username;
    var item = {};
    item[socket.id] = roomId != 'notification' ? target : false;
    online_users[username] = item;

    socket.join(roomId);
  }

  function removeSocketInfo(socket) {
    // remove entry from online_users
    var username = socket.username;
    var sid = socket.id;
    var chatId = '';
    delete online_users[username];
  }

  function notifyAll(chatId, sentBy) {
    chats[chatId].forEach((user, i) => { // for every user in chat
      console.log( '@ notifyAll, chats[chatId] = ' + user);
      if (user != sentBy) { // except the sender
        notify[user] = true;
        console.log('  -- notify[' + user + '] = ' + notify[user]);
        if (online_users[user]){ // if this user is online
          var socketId = check_key('notification', online_users[user]);
          if (socketId != '') { // if the user is in 'notification' channel,
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
