// Chat server
var Chat = require('../models/Chat');
var User = require('../models/User');
var Logger = require('./Logger');
var logger = new Logger();
var socketio = require('socket.io');

module.exports.listen = function(server) {
  io = socketio.listen(server);

  io.on('connection', function(socket) {
    socket.on('init', function(chatId) {
      socket.join(chatId);
      var log = logger.init(socket.id, chatId);
      // console.log('===== ' + socket.id + ' connected to: ', chatId);
      var msg = 'SYSTEM : You are now connected to chat!';
      var bmsg = 'SYSTEM : Your opponent is connected to chat!';
      // socket.emit('clear');
      // socket.emit('receive message', log);
      socket.emit('init log', log);
      socket.emit('receive message', msg);
      socket.broadcast.to(chatId).emit('receive message', bmsg);
    });

    socket.on('send message', function(chatId, username, msg, date) {
      // var stamp = Date.now();
      // console.log(msg);
      io.in(chatId).emit('receive message', username, msg, getDateString(date));

      logger.appendLog(chatId, username, text, date);
      console.log(logger.getLogArray(chatId));
    });

    socket.on('disconnect', function() {
      // io.sockets.client(room); <<< get array of sockets in room
      console.log('a user disconnected: ', socket.id);
      var chatId = logger.getChatId(socket.id);
      io.in(chatId).emit('receive message', 'SYSTEM: A user disconnected.');
      var localLog = logger.socketIdExpired(socket.id);
      console.log(' %%%% returned local log: ' + localLog);
    });

    socket.on('end chat', function(chatId) {
      console.log(' flushing ', chatId);
      // close room, flush logger's log, and send it to DB.
    });
  });

  function getDateString(date) {
    // var date = new Date(Date.now());
    console.log(date.toISOString());
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
