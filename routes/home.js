var express = require('express');
var router = express.Router();
var passport = require('../config/passport');


//홈에 나타내기
var Post = require('../models/Post');
var Notice = require('../models/Notice');
var Free = require('../models/Free');
var Trade = require('../models/Trade');



// Home

//index showing
router.get('/', async function(req, res) {

    var notices = await Post.find({
        board: 'notice'
      })
      .populate('author')
      .sort('-likes')
      .limit(5)
      .exec();

    var frees = await Post.find({
          board: 'free'
        })
        .populate('author')
        .sort('-likes')
        .limit(5)
        .exec();
    var trades = await Post.find({
            board: 'trade'
            })
            .populate('author')
            .sort('-likes')
            .limit(5)
            .exec();



  res.render('home/welcome',{

    posts: notices,
    postss: frees,
    postsss:trades,
    boardName: 'notice',

  });
});

router.get('/about', function(req, res){
  res.render('home/about');
});


//login
router.get('/login', function(req, res) {
  var username = req.flash('username')[0];
  var errors = req.flash('errors')[0] || {};
  res.render('home/login', {
    username: username,
    errors: errors
  });
});


// Post Login // 3
router.post('/login', function(req, res, next) {
    var errors = {};
    var isValid = true;

    if (!req.body.username) {
      isValid = false;
      errors.username = 'Username is required!';
    }
    if (!req.body.password) {
      isValid = false;
      errors.password = 'Password is required!';
    }

    if (isValid) {
      passport.authenticate('local-login', function(err, user, passKey){
        if (err) {return next(err);}
        if (!user) {return res.redirect('/login');}
        res.locals.passKey = passKey;
        req.passKey = passKey
        // user.passKey = passKey;
        console.log(' on authenticate, res.locals.passKey = ' + res.locals.passKey);
        console.log(' on authenticate, req.passKey = ' + req.passKey);
        req.login(user, function(err){
          if (err) return next(err);
          return res.redirect('/');
        });

      })(req,res,next);
    } else {
      req.flash('errors', errors);
      return res.redirect('/login');
    }
  });
  // passport.authenticate('local-login', {
  //   successRedirect: '/',
  //   failureRedirect: '/login'
  // }));

// Logout // 4
router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});


















module.exports = router;
