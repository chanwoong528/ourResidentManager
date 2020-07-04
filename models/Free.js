var mongoose = require('mongoose');
var Post = require('./Post');

var Free = Post.discriminator('free', new mongoose.Schema({
  // add 'free' specific properties
  _free: {
    type: String,
    default: 'example property'
  }
}));

module.exports = mongoose.model('free');
