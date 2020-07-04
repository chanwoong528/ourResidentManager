var mongoose = require('mongoose');
var Post = require('./Post');

var Trade = Post.discriminator('trade', new mongoose.Schema({
  // add 'free' specific properties
  _trade: {
    type: String,
    default: 'example property'
  }
}));

module.exports = mongoose.model('trade');
