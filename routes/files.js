var express = require('express');
var router = express.Router();
var File = require('../models/File');

router.get('/:serverFileName/:originalFileName', function(req, res) {
  File.findOne({ serverFileName: req.params.serverFileName, originalFileName: req.params.originalFileName }, async function(err, file) { // 1
    if (err) return res.json(err);

    var stream; // 2
    var statusCode = 200; // 2
    try {
      stream = await file.getFileStream(); // 3
    } catch (e) {
      statusCode = e; // 4
      console.log('error catch eee');
    }

    if (stream) {
      res.writeHead(statusCode, { // 5
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename=' + encodeURI(file.originalFileName)
      });
      stream.pipe(res);
    } else {
      console.log('cannot access api box!!');
      res.statusCode = statusCode; //5
      res.end();
    }
  });
});


module.exports = router;
