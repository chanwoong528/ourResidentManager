var express = require('express');
var router = express.Router();

var passport = require('../config/passport');

// Home
router.get('/', function(req, res) {
  //console.log(req.url);
  console.log(' did it went through?? = ' + req.passKey);
  res.render('home/welcome');
});
router.get('/about', function(req, res) {
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
