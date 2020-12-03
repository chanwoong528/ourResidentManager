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

module.exports = router;