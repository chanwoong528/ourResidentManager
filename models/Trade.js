var mongoose = require('mongoose');
var Post = require('./Post');

var Trade = Post.discriminator('trade', new mongoose.Schema({
  // add 'free' specific categories
  _trade: {
    type: String,
    default: 'trade specific'
  }
}));

module.exports = mongoose.model('trade');
