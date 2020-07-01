var express = require('express');
var router = express.Router();
var Comment = require('../models/Comment');
var Notice = require('../models/Notice');
var util = require('../util');

// create
router.post('/', util.isLoggedin, checkNoticeId, function(req, res) { // 1
  var notice = res.locals.notice; // 1-1

  req.body.author = req.user._id; // 2
  req.body.notice = notice._id; // 2

  Comment.create(req.body, function(err, comment) {
    if (err) {
      req.flash('commentForm', {
        _id: null,
        form: req.body
      }); // 3
      req.flash('commentError', {
        _id: null,
        errors: util.parseError(err)
      }); // 3
    }
    return res.redirect('/notices/' + notice._id + res.locals.getPostQueryString()); //4
  });
});

// update // 2
router.put('/:id', util.isLoggedin, checkPermission, checkNoticeId, function(req, res) {
  var notice = res.locals.notice;

  req.body.updatedAt = Date.now();
  Comment.findOneAndUpdate({
    _id: req.params.id
  }, req.body, {
    runValidators: true
  }, function(err, comment) {
    if (err) {
      req.flash('commentForm', {
        _id: req.params.id,
        form: req.body
      });
      req.flash('commentError', {
        _id: req.params.id,
        errors: util.parseError(err)
      });
    }
    return res.redirect('/notices/' + notice._id + res.locals.getPostQueryString());
  });
});

// destroy // 3
router.delete('/:id', util.isLoggedin, checkPermission, checkNoticeId, function(req, res) {
  var notice = res.locals.notice;

  Comment.findOne({
    _id: req.params.id
  }, function(err, comment) {
    if (err) return res.json(err);

    // save updated comment
    comment.isDeleted = true;
    comment.save(function(err, comment) {
      if (err) return res.json(err);

      return res.redirect('/notices/' + notice._id + res.locals.getPostQueryString());
    });
  });
});

module.exports = router;

// private functions
function checkPermission(req, res, next) { // 1
  Comment.findOne({
    _id: req.params.id
  }, function(err, comment) {
    if (err) return res.json(err);
    if (comment.author != req.user.id) return util.noPermission(req, res);

    next();
  });
}

function checkNoticeId(req, res, next) { // 1
  Notice.findOne({
    _id: req.query.noticeId
  }, function(err, notice) {
    if (err) return res.json(err);

    res.locals.notice = notice; // 1-1
    next();
  });
}
