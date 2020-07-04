var mongoose = require('mongoose');
var Post = require('./Post');

var Notice = Post.discriminator('notice', new mongoose.Schema({
  // add 'free' specific properties
  _notice: {
    type: String,
    default: 'example property'
  }
}));

module.exports = mongoose.model('notice');
