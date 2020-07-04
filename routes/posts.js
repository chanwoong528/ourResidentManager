var express  = require('express');
var router = express.Router();
var Post = require('../models/Post');
var Notice = require('../models/Notice');
var Free = require('../models/Free');
var Trade = require('../models/Trade');
var Comment = require('../models/Comment'); // 1
var util = require('../util'); // 1

// Index
router.get('/', async function(req, res){
  // console.log('boardName before:' + boardName);
  var boardName = getBoardName(req, res);
  var bName_singular = boardName.slice(0,-1);
  // console.log('boardName after getBoardName:' + boardName);
  var page = Math.max(1, parseInt(req.query.page));   // 2
  var limit = Math.max(1, parseInt(req.query.limit)); // 2
  page = !isNaN(page)?page:1;                         // 3
  limit = !isNaN(limit)?limit:10;                     // 3

  var skip = (page-1)*limit; // 4
  var count = await Post.countDocuments({board: bName_singular}); // 5
  var maxPage = Math.ceil(count/limit); // 6
  var posts = await Post.find({board: bName_singular}) // 7
    .populate('author')
    .sort('-createdAt')
    .skip(skip)   // 8
    .limit(limit) // 8
    .exec();

  res.render(boardName + '/index', {
    posts:posts,
    boardName:boardName,
    currentPage:page, // 9
    maxPage:maxPage,  // 9
    limit:limit       // 9
  });
});

// New
router.get('/new', util.isLoggedin, function(req, res){
  // console.log('new:' + getBoardName(req, res));
  var boardName = getBoardName(req, res);
  var bName_singular = boardName.slice(0,-1);
  var post = req.flash(bName_singular)[0] || {};
  var errors = req.flash('errors')[0] || {};

  res.render(boardName + '/new', { post:post, boardName:boardName, errors:errors });
});

// create
router.post('/', util.isLoggedin, function(req, res){
  var boardName = getBoardName(req, res);
  var bName_singular = boardName.slice(0,-1);
  req.body.author = req.user._id; // 2

  switch(boardName){
    case 'notices':
      // console.log('match:notice');
      Notice.create(req.body, function (err,post){
        createHelper(err, req, res);
      });
      break;
    case 'frees':
      // console.log('match:free');
      Free.create(req.body, function (err,post){
        createHelper(err, req, res);
      });
      break;
    case 'trades':
      // console.log('match:trade');
      Trade.create(req.body, function (err,post){
        createHelper(err, req, res);
      });
      break;
    default:
      // console.log('No matching board');
  }
});

// show
router.get('/:id', function(req, res){ // 2
  var boardName = getBoardName(req, res);
  var bName_singular = boardName.slice(0,-1);
  var commentForm = req.flash('commentForm')[0] || {_id: null, form: {}};
  var commentError = req.flash('commentError')[0] || { _id:null, parentComment: null, errors:{}};

  Promise.all([
      Post.findOne({_id:req.params.id}).populate({ path: 'author', select: 'username' }),
      Comment.find({post:req.params.id}).sort('createdAt').populate({ path: 'author', select: 'username' })
    ])
    .then(([post, comments]) => {
      res.render(boardName + '/show', { post:post, boardName:boardName, comments:comments, commentForm:commentForm, commentError:commentError});
    })
    .catch((err) => {
      console.log('err: ', err);
      return res.json(err);
    });
});

// edit
router.get('/:id/edit', util.isLoggedin, checkPermission, function(req, res){
  var boardName = getBoardName(req, res);
  var bName_singular = boardName.slice(0,-1);
  var post = req.flash(bName_singular)[0];
  var errors = req.flash('errors')[0] || {};
  if(!post){
    Post.findOne({_id:req.params.id}, function(err, post){
        if(err) return res.json(err);
        res.render(boardName + '/edit', { post:post, boardName:boardName, errors:errors });
      });
  }
  else {
    post._id = req.params.id;
    res.render(boardName + '/edit', { post:post, boardName:boardName, errors:errors });
  }
});

// update
router.put('/:id', util.isLoggedin, checkPermission, function(req, res){
  var boardName = getBoardName(req, res);
  var bName_singular = boardName.slice(0,-1);
  req.body.updatedAt = Date.now();
  Post.findOneAndUpdate({_id:req.params.id}, req.body, {runValidators:true}, function(err, post){
    if(err){
      req.flash(boardName, req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/' + boardName + '/' + req.params.id + '/edit');
    }
    res.redirect('/' + boardName + '/' + req.params.id);
  });
});

// destroy
router.delete('/:id', util.isLoggedin, checkPermission, function(req, res){
  var boardName = getBoardName(req, res);
  var bName_singular = boardName.slice(0,-1);
  Post.deleteOne({_id:req.params.id}, function(err){
    if(err) return res.json(err);
    res.redirect('/' + boardName);
  });
});

module.exports = router;

function checkPermission(req, res, next){
  Post.findOne({_id:req.params.id}, function(err, post){
    if(err) return res.json(err);
    if(post.author != req.user.id) return util.noPermission(req, res);

    next();
  });
}

function getBoardName(req, res, next){
  var boardName = req.originalUrl.split("/")[1];
  console.log("getBoardName called: " + boardName);
  boardName = boardName.split("?")[0];
  return boardName;
  next();
}

function createHelper(err, req, res){
  // console.log('createHelper called')
  if(err){
    req.flash(bName_singular , req.body);
    req.flash('errors', util.parseError(err));
    return res.redirect('/' + boardName + '/new');
  }
  res.redirect('/' + boardName);
}
