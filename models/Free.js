var mongoose = require('mongoose');
var Post = require('./Post');

var Free = Post.discriminator('free', new mongoose.Schema({
  // add 'free' specific categories
  _free: {
    type: String,
    default: 'free specific'
  }
}));

module.exports = mongoose.model('free');
