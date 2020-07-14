// Chat server
var Chat = require('../models/Chat');
var User = require('../models/User');
var Logger = require('./Logger');
var logger = new Logger();
var socketio = require('socket.io');

var usernames = {}; // key = username, value = {key = socket.id, value = chatId}
var chats = {}; // key = chatId, value = [username Array]

function check_key(v, m) {
  var val = '';
  for (var key in m) {
    if (m[key] == v)
      val = key;
  }
  return val;
}

module.exports.listen = function(server) {
  io = socketio.listen(server);

  io.on('connection', function(socket) {
    socket.on('chat init', function(chatId, username) {
      if (!chatId || !username) {
        socket.emit('redirect');
      }
      addSocketInfo(socket, chatId, username);

      socket.join(chatId);
      logger.initLogMap(chatId);

      var log = logger.obtainLog(chatId);
      if (log != null && log !== undefined) {
        log.forEach((item, i) => {
          socket.emit('receive message', item.username, item.msg, getDateString(item.date));
        });
      }
      // init ends here
    });

    socket.on('notification init', function(username) {
      var roomId = 'notification';
      addSocketInfo(socket,roomId,username);
      socket.join(roomId);
    });

    socket.on('send notification', function(username){

    });

    socket.on('request chat list', function(username){
      // search DB Chat collection for socket's username
      if (username){
        Chat.findAllByUsername(username, function (err, chats){
          if (err) {
            console.log (' ERR @ request chat list (1)');
            console.log(err);
          }
          if (chats){
            console.log(' DB CHATS : \n' + chats);
            // socket.emit('receive chat list', chats);
            chats.forEach((chat, i) => {
              var data = new Array();
              var chatId = chat._id.toString();
              data.push(chatId);
              chat.users.forEach((user, i) => {
                if (user != username){
                  data.push(user);
                }
              });
              var msg = "This is a temporary message.";
              var stamp = "Month 00";
              data.push (msg);
              data.push (stamp);
              console.log ('data : ' + data);
              var temp = {name:"you", king:"queen"};
              socket.emit('receive chat list', {data, temp});
            });


          }
        });


      }

    });

    socket.on('send message', function(data) {
      // data == {(String) chatId, (String) username, (String) msg, (Number) date}
      // console.log('======send message=======');
      // console.log('    data          : ' + data);
      // console.log('     -- room      : ' + data.chatId);
      // console.log('     -- username  : ' + data.username);
      // console.log('     -- msg       : ' + data.msg);
      // console.log('     -- date      : ' + data.date);
      printData(data);
      data.date = Date.now();
      // convert date number into time stamp
      var stamp = getDateString(new Date(data.date));
      io.in(data.chatId).emit('receive message', data.username, data.msg, stamp);

      var log = { "username": data.username, "msg": data.msg, "date": data.date };
      // logger.addLog(data.chatId, log);
      // console.log(logger.getLog(data.chatId));

      var retLog = logger.addLogToChat(data.chatId, data.username, data.msg, data.date);
      console.log(retLog.toString());
      console.log('======send message==END==');
    });

    socket.on('disconnect', function() {
      removeSocketInfo(socket);
      console.log('[' + socket.username + '] disconnected.');

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

  function addSocketInfo(socket, chatId, username){
    socket.username = username;
    var item = {};
    item[socket.id] = chatId;
    usernames[username] = item;
    if (!chats[chatId]) {
      chats[chatId] = new Array();
    }
    if (!chats[chatId].includes(username)){
      chats[chatId].push(username);
    }
  }

  function removeSocketInfo(socket){
    // remove entry from usernames
    var username = socket.username;
    var sid = socket.id;
    if (username){
      var chatId = usernames[username][sid];
      delete usernames[username];
    }
  }

  function checkNotified(){

  }

  function printData(data, spaces){
    var allowed = (typeof spaces == typeof 15) && (spaces <= 20);
    var s = allowed?spaces:15;
    if(data){
      console.log('    data           : ' + data);
      for (var key in data){
        var str = '-- ' + key;
        var i;
        for (i = 0; i < s-str.length; i++){
          str += ' ';
        }
        str += ': ' + data[key];
        if (typeof data[key] != 'string' && typeof data[key] != 'number'){
          for (var k in data[key]){
            var str2 = '---- ' + k;
            var j;
            for (j = 0; j < s-str2.length; j++){
              str2 += ' ';
            }
            str2 += ': ' + data[key][k];
            console.log(str2);
          }
        } else {
          console.log(str);
        }
      }
    }
  }

  function getDateString(dateNum) {
    var date = new Date(dateNum);
    console.log(date.toString());
    var y = date.getFullYear();
    var m = addZero(date.getMonth() + 1);
    var d = addZero(date.getDate());
    var hh = addZero(date.getHours());
    var mm = addZero(date.getMinutes());
    return y + '-' + m + '-' + d + " | " + hh + ':' + mm;
  }

  /**
   * @WIP
   */
  function convertToTimeStamp(date) {
    var date1 = new Date('7/13/2010');
    var date2 = new Date(Date.now());

    var h = date.getHours();
    var g = h - 12;
    var i = (g < 0 || g == 12) ? '오전' : '오후';
    var hh = addZero((i == '오후') ? g : h);
    var mm = addZero(date.getMinutes());
    var ret = i + ' ' + hh + ':' + mm + ' | ';

    var diffTime = Math.abs(date2 - date);

    var diff = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    var urn = (diff > 0) ? diff + '년 전' : '';
    if (urn != '') return ret + urn;

    diff = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
    urn = (diff > 0) ? diff + '달 전' : '';
    if (urn != '') return ret + urn;

    diff = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    urn = (diff > 1) ? diff + '일 전' : '';
    if (urn != '') return ret + urn;

    diff = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    urn = (diff > 1) ? diff + '일 전' : '';
    if (urn != '') return ret + urn;

    return ret + urn;
    console.log(diffTime + " milliseconds");
    console.log(diffDays + " days");

  }

  function addZero(i) {
    if (i < 10) {
      i = "0" + i;
    }
    return i;
  }
}
