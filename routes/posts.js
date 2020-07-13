var express = require('express');
var router = express.Router();
var Post = require('../models/Post');
var Notice = require('../models/Notice');
var Free = require('../models/Free');
var Trade = require('../models/Trade');
var Comment = require('../models/Comment');
var util = require('../util');
var User = require('../models/User');



// Index
router.get('/:boardName', async function(req, res) {
  var boardName = req.params.boardName;
  var postType = boardName.slice(0, -1);
  var page = Math.max(1, parseInt(req.query.page));
  var limit = Math.max(1, parseInt(req.query.limit));
  page = !isNaN(page) ? page : 1;
  limit = !isNaN(limit) ? limit : 10;

  var skip = (page - 1) * limit;
  var count = await Post.countDocuments({
    board: postType
  });
  var maxPage = Math.ceil(count / limit);
  var posts = await Post.find({
      board: postType
    })
    .populate('author')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit)
    .exec();

  res.render('boards/' + boardName + '/index', {
    posts: posts,
    boardName: boardName,
    currentPage: page,
    maxPage: maxPage,
    limit: limit
  });
});

// New
router.get('/:boardName/new', util.isLoggedin, function(req, res) {
  var boardName = req.params.boardName;
  var postType = boardName.slice(0, -1);
  var post = req.flash(postType)[0] || {};
  var errors = req.flash('errors')[0] || {};
  if(boardName =='notices'&& !req.user.isAdmin)
  {
    return util.noPermission(req, res);

  }
  else{
  res.render('boards/' + boardName + '/new', {
    post: post,
    boardName: boardName,
    errors: errors

  });}
});

// create
router.post('/:boardName', util.isLoggedin, function(req, res) {
  var boardName = req.params.boardName;
  var postType = boardName.slice(0, -1);
  req.body.author = req.user._id;

  switch (boardName) {
    case 'notices':

      Notice.create(req.body, function(err, post) {

        createHelper(err, req, res);

      });
      break;
    case 'frees':
      Free.create(req.body, function(err, post) {
        createHelper(err, req, res);
      });
      break;
    case 'trades':
      Trade.create(req.body, function(err, post) {
        createHelper(err, req, res);
      });
      break;
    default:
      // console.log('No matching board');

  }
});

// show
router.get('/:boardName/:id', function(req, res) {
  var boardName = req.params.boardName;
  var postType = boardName.slice(0, -1);
  var likes = Post.likes;
  var views = Post.views;
  var comments = Post.comments;
  var commentForm = req.flash('commentForm')[0] || {
    _id: null,
    form: {}
  };
  var commentError = req.flash('commentError')[0] || {
    _id: null,
    parentComment: null,
    errors: {}
  };

  Promise.all([
      Post.findOne({
        _id: req.params.id
      }).populate({
        path: 'author',
        select: ['name','username']
      }),
      Comment.find({
        post: req.params.id
      }).sort('createdAt').populate({
        path: 'author',
        select: ['name','username']
      })
    ])
    .then(([post, comments]) => {
      var liked = false;

        post.views++; // 2
        post.save();
      // console.log('req.user = ' + req.user);
      if (req.user) {
        var arr = post.likedPerson;
        var userName = arr.find(element => element.equals(req.user._id));
        if (userName === undefined) {
          // console.log(' liked is now false');
          liked = false;
        } else {
          // console.log(' liked is now true');
          liked = true;
        }
      }
      res.render('boards/' + boardName + '/show', {
        post: post,
        boardName: boardName,
        comments: comments,
        commentForm: commentForm,
        commentError: commentError,
        likes: likes,
        liked: liked,
        views: views,

      });
    })
    .catch((err) => {
      console.log('err: ', err);
      return res.json(err);
    });
});

// edit
router.get('/:boardName/:id/edit', util.isLoggedin, checkPermission, function(req, res) {
  var boardName = req.params.boardName;
  var postType = boardName.slice(0, -1);
  var post = req.flash(postType)[0];
  var errors = req.flash('errors')[0] || {};
  if (!post) {
    Post.findOne({
      _id: req.params.id
    }, function(err, post) {
      if (err) return res.json(err);
      res.render('boards/' + boardName + '/edit', {
        post: post,
        boardName: boardName,
        errors: errors
      });
    });
  } else {
    post._id = req.params.id;
    res.render('boards/' + boardName + '/edit', {
      post: post,
      boardName: boardName,
      errors: errors
    });
  }
});

// update
router.put('/:boardName/:id', util.isLoggedin, checkPermission, function(req, res) {
  var boardName = req.params.boardName;
  var postType = boardName.slice(0, -1);
  req.body.updatedAt = Date.now();

  Post.findOneAndUpdate({
    _id: req.params.id
  }, req.body, {
    runValidators: true
  }, function(err, post) {
    if (err) {
      req.flash(postType, req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/boards/' + boardName + '/' + req.params.id + '/edit');
    }
    res.redirect('/boards/' + boardName + '/' + req.params.id);
  });
});

// destroy
router.delete('/:boardName/:id', util.isLoggedin, checkPermission, function(req, res) {
  var boardName = req.params.boardName;
  var postType = boardName.slice(0, -1);

  Post.deleteOne({
    _id: req.params.id
  }, function(err) {
    if (err) return res.json(err);
    res.redirect('/boards/' + boardName);
  });
});

//likes
router.post('/:boardName/:id/likes', util.isLoggedin,
  function(req, res) {
    var boardName = req.params.boardName;
    var postType = boardName.slice(0, -1);
    Post.findOne({
      _id: req.params.id
    }, function(err, post) {
      if (err) {
        console.log(err);
        return res.status(500).send('Something went wrong!');
      } else {
        var arr = post.likedPerson;
        var userName = arr.find(element => element.equals(req.user._id));
        if (userName === undefined) {
          post.likedPerson.push(req.user._id);
          post.likes += 1;
          post.save(function(err) {
            if (err) return res.status(500).send('Something went wrong!');
          });
        }
      }
      return res.redirect('/boards/' + boardName + '/' + req.params.id);
    });
  });

module.exports = router;

function checkPermission(req, res, next) {
  Post.findOne({
    _id: req.params.id
  }, function(err, post) {
    if (err) return res.json(err);
    if (post.author != req.user.id) return util.noPermission(req, res);

    next();
  });
}

function createHelper(err, req, res) {
  var boardName = req.params.boardName;
  var postType = boardName.slice(0, -1);
  if (err) {
    req.flash(postType, req.body);
    req.flash('errors', util.parseError(err));
    return res.redirect('/boards/' + boardName + '/new');
  }
  res.redirect('/boards/' + boardName);
}
