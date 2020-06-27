var express  = require('express');
var router = express.Router();
var Notice = require('../models/Notice');
var util = require('../util'); // 1

// Index
router.get('/', function(req, res){
  Notice.find({})
    .populate('author') // 1
    .sort('-createdAt')
    .exec(function(err, notices){
      if(err) return res.json(err);
      res.render('notices/index', {notices:notices});
    });
});

// New
router.get('/new', util.isLoggedin, function(req, res){
  var notice = req.flash('notice')[0] || {};
  var errors = req.flash('errors')[0] || {};
  res.render('notices/new', { notice:notice, errors:errors });
});

// create
router.post('/', util.isLoggedin, function(req, res){
  req.body.author = req.user._id; // 2
  Notice.create(req.body, function(err, notice){
    if(err){
      req.flash('notice', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/notices/new');
    }
    res.redirect('/notices');
  });
});

// show
router.get('/:id', function(req, res){
  Notice.findOne({_id:req.params.id}) // 3
    .populate('author')             // 3
    .exec(function(err, notice){      // 3
      if(err) return res.json(err);
      res.render('notices/show', {notice:notice});
    });
});

// edit
router.get('/:id/edit', util.isLoggedin, checkPermission, function(req, res){
  var notice = req.flash('notice')[0];
  var errors = req.flash('errors')[0] || {};
  if(!notice){
    Notice.findOne({_id:req.params.id}, function(err, notice){
        if(err) return res.json(err);
        res.render('notices/edit', { notice:notice, errors:errors });
      });
  }
  else {
    notice._id = req.params.id;
    res.render('notices/edit', { notice:notice, errors:errors });
  }
});

// update
router.put('/:id', util.isLoggedin, checkPermission, function(req, res){
  req.body.updatedAt = Date.now();
  Notice.findOneAndUpdate({_id:req.params.id}, req.body, {runValidators:true}, function(err, notice){
    if(err){
      req.flash('notice', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/notices/'+req.params.id+'/edit');
    }
    res.redirect('/notices/'+req.params.id);
  });
});

// destroy
router.delete('/:id', util.isLoggedin, checkPermission, function(req, res){
  Notice.deleteOne({_id:req.params.id}, function(err){
    if(err) return res.json(err);
    res.redirect('/notices');
  });
});

module.exports = router;

function checkPermission(req, res, next){
  Notice.findOne({_id:req.params.id}, function(err, notice){
    if(err) return res.json(err);
    if(notice.author != req.user.id) return util.noPermission(req, res);

    next();
  });
}
