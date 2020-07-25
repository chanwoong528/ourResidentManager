var express = require('express');
var router = express.Router();
var User = require('../models/User');
var util = require('../libs/util'); // 1


//checkid if exist
router.get('/checkid', function(req, res) {
  var username = req.flash('username')[0];
  var errors = req.flash('errors')[0] || {};
  res.render('users/checkid',
   {
    username: username,
    errors: errors
    });
  });

router.post('/checkid', async function(req, res) {
  var errors = req.flash('errors')[0] || {};
  var user = await User.findOne({username:req.body.username,
                                  name:req.body.name
                                })
                        .exec();


    if (user)
    {
      user.forgot= true;
      res.render('users/checkques',{
          username: user.username,
          name: user.name,
          pass_question: user.pass_question,
          errors: errors
          });
    }
    else
    {
      res.render('users/checkid',{
          username: user.username,
          errors: errors
          });

    }
  });
router.post('/checkques',  function(req, res) {
var errors = req.flash('errors')[0] || {};
User.findOne({ username:req.body.username,
                                  pass_answer:req.body.pass_answer
                                })
                                .select({username:1,
                                  name:1,
                                  pass_question:1,
                                  pass_answer:1,
                                })
                              .exec(function(err, user){

                                if(user)
                                {
                                  user.forgot = true;
                                  user.save();

                                  res.render('users/passreset',
                                                            { username:user.username,
                                                              name:user.name,
                                                              pass_question:user.pass_question,
                                                              pass_answer:user.pass_answer,
                                                              errors:errors
                                                            });
                                }
                                else
                                {
                                      res.render('users/login',{

                                      });

                                }


                              });


});
router.put('/passreset', async function(req, res) {


  User.findOne({username:req.body.username})
      .select({password:1, forgot:1})
      .exec(function(err, user){

      if(err) return res.json(err);

      console.log('userpassword'+user.password);
      // update user object


      user.password = req.body.newPassword;
      user.forgot = false;
      // save updated user
      user.save(function(err, user){
        if(err){
          req.flash('user', req.body);
          req.flash('errors', util.parseError(err));
          return res.redirect('/users/passreset'); // 1
        }

        console.log('123123');
        res.redirect('/');
      });
  });


});

// Index
router.get('/', util.isLoggedin, util.isAdmin, function(req, res){

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



//suspended
router.get('/suspended/:username', util.isAdmin, async function(req, res){
  var user =  await User.findOne({username:req.params.username})
            .exec();
            //console.log('user:'+user);
            user.suspended = true;
            user.save();
            //console.log('user:'+user);
  res.redirect('/users');
  });
  //unsuspended
  router.get('/unsuspended/:username', util.isAdmin, async function(req, res){
    var user =  await User.findOne({username:req.params.username})
              .exec();
              //console.log('user:'+user);
              user.suspended = false;
              user.save();
              //console.log('user:'+user);
    res.redirect('/users');
    });


//update verified
  router.get('/verified/:username', util.isAdmin, async function(req, res){
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

    res.redirect('/');
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






  // destroy
  router.get('/delete/:username', util.isAdmin,  function(req, res){

        User.deleteOne({username:req.params.username}, function(err){
        if(err) return res.json(err);

    res.redirect('/users');
  })
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
