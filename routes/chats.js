var express = require('express');
var router = express.Router();

router.get('/', function(req, res){
  //console.log(req.url);
  res.render('dm/index');
});
router.get('/:id', function(req, res){
  res.render('home/' + id);
});

module.exports = router;
