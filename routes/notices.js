var express  = require('express');
var router = express.Router();
var Notice = require('../models/Notice');
var Comment = require('../models/Comment'); // 1
var util = require('../util'); // 1

// Index
router.get('/', async function(req, res){ // 1
  var page = Math.max(1, parseInt(req.query.page));   // 2
  var limit = Math.max(1, parseInt(req.query.limit)); // 2
  page = !isNaN(page)?page:1;                         // 3
  limit = !isNaN(limit)?limit:10;                     // 3

  var skip = (page-1)*limit; // 4
  var count = await Notice.countDocuments({}); // 5
  var maxPage = Math.ceil(count/limit); // 6
  var notices = await Notice.find({}) // 7
    .populate('author')
    .sort('-createdAt')
    .skip(skip)   // 8
    .limit(limit) // 8
    .exec();

  res.render('notices/index', {
    notices:notices,
    currentPage:page, // 9
    maxPage:maxPage,  // 9
    limit:limit       // 9
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
router.get('/:id', function(req, res){ // 2
  var commentForm = req.flash('commentForm')[0] || {_id: null, form: {}};
  var commentError = req.flash('commentError')[0] || { _id:null, parentComment: null, errors:{}};

  Promise.all([
      Notice.findOne({_id:req.params.id}).populate({ path: 'author', select: 'username' }),
      Comment.find({notice:req.params.id}).sort('createdAt').populate({ path: 'author', select: 'username' })
    ])
    .then(([notice, comments]) => {
      res.render('notices/show', { notice:notice, comments:comments, commentForm:commentForm, commentError:commentError});
    })
    .catch((err) => {
      console.log('err: ', err);
      return res.json(err);
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
