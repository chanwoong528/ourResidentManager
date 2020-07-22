var express = require('express');
var router = express.Router();
var User = require('../models/User');
var util = require('../libs/util'); // 1



// Index
router.get('/', util.isLoggedin, function(req, res){

      User.find({})
      .sort({username:1})
      .exec(function(err, users){
        if(err)
        {    //console.log("nopermssion here2");
          return res.json(err);
        }
        res.render('users/index', {
          users:users,
        });
    });
  });


  // destroy
  router.get('/delete/:username',  function(req, res){

        User.deleteOne({username:req.params.username}, function(err){
        if(err) return res.json(err);

    res.redirect('/users');
  })
});

//suspended
router.get('/suspended/:username', async function(req, res){
  var user =  await User.findOne({username:req.params.username})
            .exec();
            //console.log('user:'+user);
            user.suspended = true;
            user.save();
            //console.log('user:'+user);
  res.redirect('/users');
  });
  //unsuspended
  router.get('/unsuspended/:username', async function(req, res){
    var user =  await User.findOne({username:req.params.username})
              .exec();
              //console.log('user:'+user);
              user.suspended = false;
              user.save();
              //console.log('user:'+user);
    res.redirect('/users');
    });


//update verified
  router.get('/verified/:username', async function(req, res){
  var user =  await User.findOne({username:req.params.username})
            .exec();
            //console.log('user:'+user);
            user.verified = true;
            user.save();
            //console.log('user:'+user);
  res.redirect('/users');
  });

// New
router.get('/new', function(req, res){
  var user = req.flash('user')[0] || {};
  var errors = req.flash('errors')[0] || {};
  res.render('users/new', { user:user, errors:errors });
});



// create
router.post('/', function(req, res){



  User.create(req.body, function(err, user){
    if(err){
      req.flash('user', req.body);
      req.flash('errors', util.parseError(err));


      return res.redirect('/users/new');
    }

    res.redirect('/users');
  });
});



// show
router.get('/:username', util.isLoggedin, checkPermission, function(req, res){
  User.findOne({username:req.params.username}, function(err, user){
    if(err) return res.json(err);
    res.render('users/show', {user:user});
  });
});

// edit
router.get("/:username/edit", util.isLoggedin, checkPermission, function(req, res){
  var user = req.flash('user')[0];
  var errors = req.flash('errors')[0] || {};
  if(!user){
    User.findOne({username:req.params.username}, function(err, user){
      if(err) return res.json(err);
      res.render('users/edit', { username:req.params.username, user:user, errors:errors });
    });
  }
  else {
    res.render('users/edit', { username:req.params.username, user:user, errors:errors });
  }
});

// update
router.put("/:username", util.isLoggedin, checkPermission, function(req, res, next){
  User.findOne({username:req.params.username})
    .select('password')
    .exec(function(err, user){
      if(err) return res.json(err);

      // update user object
      user.originalPassword = user.password;
      user.password = req.body.newPassword? req.body.newPassword : user.password;
      for(var p in req.body){
        user[p] = req.body[p];
      }


      // save updated user
      user.save(function(err, user){
        if(err){
          req.flash('user', req.body);
          req.flash('errors', util.parseError(err));
          return res.redirect('/users/'+req.params.username+'/edit'); // 1
        }
        res.redirect('/users/'+user.username);
      });
  });
});





module.exports = router;

// functions
function parseError(errors){
  var parsed = {};
  if(errors.name == 'ValidationError'){
    for(var name in errors.errors){
      var validationError = errors.errors[name];
      parsed[name] = { message:validationError.message };
    }
  }
  else if(errors.code == '11000' && errors.errmsg.indexOf('username') > 0) {
    parsed.username = { message:'아이디가 중복됩니다' };
  }
  else {
    parsed.unhandled = JSON.stringify(errors);
  }
  return parsed;
}
// private functions // 2
function checkPermission(req, res, next){
 User.findOne({username:req.params.username}, function(err, user){
  if(err) return res.json(err);
  if(user.id != req.user.id) return util.noPermission(req, res);

  next();
 });
}
