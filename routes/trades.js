var express  = require('express');
var router = express.Router();
var Trade = require('../models/Trade');
var util = require('../util'); // 1

// Index
router.get('/', function(req, res){
  Trade.find({})
    .populate('author') // 1
    .sort('-createdAt')
    .exec(function(err, trades){
      if(err) return res.json(err);
      res.render('trades/index', {trades:trades});
    });
});

// New
router.get('/new', util.isLoggedin, function(req, res){
  var trade = req.flash('trade')[0] || {};
  var errors = req.flash('errors')[0] || {};
  res.render('trades/new', { trade:trade, errors:errors });
});

// create
router.post('/', util.isLoggedin, function(req, res){
  req.body.author = req.user._id; // 2
  Trade.create(req.body, function(err, trade){
    if(err){
      req.flash('trade', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/trades/new');
    }
    res.redirect('/trades');
  });
});

// show
router.get('/:id', function(req, res){
  Trade.findOne({_id:req.params.id}) // 3
    .populate('author')             // 3
    .exec(function(err, trade){      // 3
      if(err) return res.json(err);
      res.render('trades/show', {trade:trade});
    });
});

// edit
router.get('/:id/edit', util.isLoggedin, checkPermission, function(req, res){
  var trade = req.flash('trade')[0];
  var errors = req.flash('errors')[0] || {};
  if(!trade){
    Trade.findOne({_id:req.params.id}, function(err, trade){
        if(err) return res.json(err);
        res.render('trades/edit', { trade:trade, errors:errors });
      });
  }
  else {
    trade._id = req.params.id;
    res.render('trades/edit', { trade:trade, errors:errors });
  }
});

// update
router.put('/:id', util.isLoggedin, checkPermission, function(req, res){
  req.body.updatedAt = Date.now();
  Trade.findOneAndUpdate({_id:req.params.id}, req.body, {runValidators:true}, function(err, trade){
    if(err){
      req.flash('trade', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/trades/'+req.params.id+'/edit');
    }
    res.redirect('/trades/'+req.params.id);
  });
});

// destroy
router.delete('/:id', util.isLoggedin, checkPermission, function(req, res){
  Trade.deleteOne({_id:req.params.id}, function(err){
    if(err) return res.json(err);
    res.redirect('/trades');
  });
});

module.exports = router;

function checkPermission(req, res, next){
  Trade.findOne({_id:req.params.id}, function(err, trade){
    if(err) return res.json(err);
    if(trade.author != req.user.id) return util.noPermission(req, res);

    next();
  });
}
