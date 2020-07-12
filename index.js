var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

var flash = require('connect-flash'); // npm
var session = require('express-session'); // npm
var passport = require('./config/passport');//npm

var util = require('./util');


var crypto = require('crypto');
var app = express();

// Socket server setting
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);



var dbUrl = 'mongodb+srv://moon528:ms5028@cluster0-vltfk.mongodb.net/TownBoard?retryWrites=true&w=majority';

// DB setting

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(dbUrl);
var db = mongoose.connection;
db.once('open', function(){
  console.log('DB connected');
});
db.on('error', function(err){
  console.log('DB ERROR : ', err);
});

// Other settings
app.set('view engine', 'ejs');

app.use(express.static(__dirname+'/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(flash()); // 2
app.use(session({secret:'MySecret', resave:true, saveUninitialized:true}));

// Passport // 2
app.use(passport.initialize());
app.use(passport.session());

// Custom Middlewares // 3
app.use(function(req,res,next){
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.currentUser = req.user;
  next();
});

// Routes
app.use('/', require('./routes/home'));
app.use('/users', require('./routes/users'));
app.use('/dm', require('./routes/chats'));
app.use('/boards', util.getPostQueryString, require('./routes/posts'));
app.use('/comments', util.getPostQueryString, require('./routes/comments'));

// Chat server
var Chat = require('./models/Chat');
var User = require('./models/User');
var Logger = require('./Logger');
var logger = new Logger();

io.on('connection', function(socket) {
  socket.on('init', function(chatId){
    socket.join(chatId);
    logger.init(socket.id, chatId);
    // console.log('===== ' + socket.id + ' connected to: ', chatId);
    var msg = 'SYSTEM : You are now connected to chat!';
    var bmsg = 'SYSTEM : Your opponent is connected to chat!';
    // socket.emit('clear');
    // socket.emit('receive message', log);
    socket.emit('receive message', msg);
    socket.broadcast.to(chatId).emit('receive message', bmsg);
  });

  socket.on('send message', function(username, text, chatId){
    var time = getDateNow();
    var msg = '[' + username + '] ' + text + ' --' + time;
    // console.log(msg);
    io.in(chatId).emit('receive message', msg);

    logger.appendLog(chatId, msg);
    console.log(logger.getLogArray(chatId));
  });

  socket.on('disconnect', function(){
    // io.sockets.client(room); <<< get array of sockets in room
    console.log('a user disconnected: ', socket.id);
    var chatId = logger.getChatId(socket.id);
    io.in(chatId).emit('receive message', 'SYSTEM: A user disconnected.');
    var localLog = logger.flush(socket.id);
    // Add server chat log to DB chat log
    Chat.findOneByChatIdString(chatId,function(err,chat){
      if (err) console.log(err);
      if (chat && localLog != -1) chat.addMsgArrayToLog(localLog);
    });
  });

  socket.on('end chat', function(chatId){
    console.log(' flushing ', chatId);
    // close room, flush logger's log, and send it to DB.
  });
});

function getDateNow(){
  var date = new Date(Date.now());
  console.log(date.toISOString());
  var y = date.getFullYear();
  var m = addZero(date.getMonth()+1);
  var d = addZero(date.getDate());
  var hh = addZero(date.getHours());
  var mm = addZero(date.getMinutes());
  return y + '-' + m + '-' + d + " " + hh + ':' + mm;
}

function addZero(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

// Port setting
var port = process.env.PORT || 3000;
server.listen(port, function(){
  console.log('server on! http://localhost:'+port);
});
// app.listen(port, function(){
//   console.log('server on! http://localhost:'+port);
// });
