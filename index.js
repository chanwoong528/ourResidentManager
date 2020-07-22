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
var io = require('./libs/socket-listener').listen(server);

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
app.use(flash());
app.use(session({secret:'MySecret', resave:true, saveUninitialized:true}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Custom Middlewares
app.use(function(req,res,next){
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.currentUser = req.user;
  res.locals.passKey = req.passKey;
  res.locals.target = '';
  next();
});

// Routes
app.use('/', require('./routes/home'));
app.use('/users', require('./routes/users'));
app.use('/dm', require('./routes/chats'));
app.use('/boards', util.getPostQueryString, require('./routes/posts'));
app.use('/comments', util.getPostQueryString, require('./routes/comments'));
app.use('/files', require('./routes/files'));
app.get('*', function(req, res){
  res.status(404).send('<b>404: Not Found</b>');
});

// Port setting
var port = process.env.PORT || 3000;
server.listen(port, function(){
  console.log('server on! http://localhost:'+port);
});


// app.listen(port, function(){
//   console.log('server on! http://localhost:'+port);
// });
