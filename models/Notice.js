var mongoose = require('mongoose');
var Post = require('./Post');

var Notice = Post.discriminator('notice', new mongoose.Schema({
  // add 'free' specific categories
  _notice: {
    type: String,
    default: 'notice specific'
  }
}));

module.exports = mongoose.model('notice');
