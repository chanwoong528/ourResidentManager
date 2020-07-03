var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

var flash = require('connect-flash'); // npm
var session = require('express-session'); // npm
var passport = require('./config/passport');//npm

var util = require('./util');

var app = express();
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
app.use('/', util.getPostQueryString, require('./routes/home'));
app.use('/users', require('./routes/users'));
app.use('/notices', require('./routes/posts'));
app.use('/frees', require('./routes/posts'));
app.use('/trades', require('./routes/posts'));
// app.use('/notices', require('./routes/notices'));
// app.use('/frees', require('./routes/frees'));
// app.use('/trades', require('./routes/trades'));
app.use('/comments', require('./routes/comments')); // 1

// Port setting
var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log('server on! http://localhost:'+port);
});
