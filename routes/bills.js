var express = require('express');
var router = express.Router();
var Bill = require('../models/Bill');
var util = require('../libs/util');
var User = require('../models/User');

//file upload
var path = require('path');
var multer = require('multer');
var upload = multer({ dest: 'uploadedFiles/' }).single('attachment');
var File = require('../models/File');

router.get('/user', util.isLoggedin, util.isSuspended, async function (req, res) {
  if (!req.user.verified) {
    return util.isVerified(req, res);
  } else {
    var page = Math.max(1, parseInt(req.query.page));
    var limit = Math.max(1, parseInt(req.query.limit));
    page = !isNaN(page) ? page : 1;
    limit = !isNaN(limit) ? limit : 10;

    var skip = (page - 1) * limit;
    var count = await Bill.countDocuments({
      receiver: req.user.username
    }).skip(skip);
    var maxPage = Math.ceil(count / limit);
    Bill.findAllByReceiver(req.user.username, function (err, bills) {
      if (err) return console.log(err);
      res.render('bills/user', {
        bills: bills,
        currentPage: page,
        maxPage: maxPage,
        limit: limit
      });
    })
  }
});

router.get('/:billId', util.isLoggedin, util.isSuspended, async function (req, res) {
  if (!req.user.verified) {
    return util.isVerified(req, res);
  } else {
    Bill.findOneByReceiver(req.params.billId, function (err, bill) {
      if (err) return console.log(err);
      res.render('bills/show', {
        bill: bill,
      });
    })
  }
});

router.get('/admin', util.isLoggedin, util.isSuspended, function (req, res) {

  if (!req.user.isAdmin) {
    return util.noPermission(req, res);
  } else if (!req.user.verified) {
    return util.isVerified(req, res);
  } else {
    res.render('bills/admin', {
      post: 'test',
      boardName: 'boardName',
      errors: 'errors'
    });
  }
});






// // Index
// router.get('/:boardName', async function (req, res) {
//   var boardName = req.params.boardName;
//   var postType = boardName.slice(0, -1);
//   var page = Math.max(1, parseInt(req.query.page));
//   var limit = Math.max(1, parseInt(req.query.limit));
//   page = !isNaN(page) ? page : 1;
//   limit = !isNaN(limit) ? limit : 10;

//   var skip = (page - 1) * limit;
//   var count = await Post.countDocuments({
//     board: postType
//   });
//   var maxPage = Math.ceil(count / limit);
//   var posts = await Post.find({
//     board: postType
//   })
//     .populate('author')
//     .sort('-createdAt')
//     .skip(skip)
//     .limit(limit)
//     .exec();

//   res.render('boards/' + boardName + '/index', {
//     posts: posts,
//     boardName: boardName,
//     currentPage: page,
//     maxPage: maxPage,
//     limit: limit
//   });
// });

// New

// create
router.post('/:boardName', util.isLoggedin, util.isSuspended, upload, async function (req, res) {
  var boardName = req.params.boardName;
  var postType = boardName.slice(0, -1);
  var attachment;
  try {
    attachment = req.file ? await File.createNewInstance(req.file, req.user._id) : undefined;
  } catch (err) {
    return res.json(err);
  }

  req.body.attachment = attachment;
  req.body.author = req.user._id;
  req.body.board = postType;
  Post.create(req.body, function (err, post) {
    // createHelper(err,req,res,post,attachment);
    if (err) {
      req.flash(postType, req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/boards/' + boardName + '/new');
    }
    if (attachment) { // 4-4
      attachment.postId = post._id; // 4-4
      attachment.save();
      // 4-4
    }
    return res.redirect('/boards/' + boardName);
  });
});

// show
router.get('/:boardName/:id', function (req, res) {
  var boardName = req.params.boardName;
  var postType = boardName.slice(0, -1);
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
    Bill.find({
      receiver: req.params.id
    }).sort('createdAt')
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
        liked: liked,

      });
    })
    .catch((err) => {
      console.log('err: ', err);
      return res.json(err);
    });
});

// edit
router.get('/:boardName/:id/edit', util.isLoggedin, checkPermission, function (req, res) {
  var boardName = req.params.boardName;
  var postType = boardName.slice(0, -1);
  var post = req.flash(postType)[0];
  var errors = req.flash('errors')[0] || {};
  if (!post) {
    Post.findOne({
      _id: req.params.id
    }, function (err, post) {
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
router.put('/:boardName/:id', util.isLoggedin, checkPermission, function (req, res) {
  var boardName = req.params.boardName;
  var postType = boardName.slice(0, -1);
  req.body.updatedAt = Date.now();

  Post.findOneAndUpdate({
    _id: req.params.id
  }, req.body, {
    runValidators: true
  }, function (err, post) {
    if (err) {
      req.flash(postType, req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/boards/' + boardName + '/' + req.params.id + '/edit');
    }
    res.redirect('/boards/' + boardName + '/' + req.params.id);
  });
});

// destroy
router.delete('/:boardName/:id', util.isLoggedin, checkPermission, function (req, res) {
  var boardName = req.params.boardName;
  var postType = boardName.slice(0, -1);

  Post.deleteOne({
    _id: req.params.id
  }, function (err) {
    if (err) return res.json(err);
    res.redirect('/boards/' + boardName);
  });
});

//likes
router.post('/:boardName/:id/likes', util.isLoggedin, function (req, res) {
  var boardName = req.params.boardName;
  var postType = boardName.slice(0, -1);
  Post.findOne({
    _id: req.params.id
  }, function (err, post) {
    if (err) {
      console.log(err);
      return res.status(500).send('Something went wrong!');
    } else {
      var arr = post.likedPerson;
      var userName = arr.find(element => element.equals(req.user._id));
      if (userName === undefined) {
        post.likedPerson.push(req.user._id);
        post.likes += 1;
        post.save(function (err) {
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
  }, function (err, post) {
    if (err) return res.json(err);
    if (post.author != req.user.id) return util.noPermission(req, res);

    next();
  });
}
