var mongoose = require('mongoose');

// schema
var Schema = mongoose.Schema;
const baseOptions = {
  discriminatorKey: 'board',
  collection: 'posts'
};
var Post = mongoose.model('post', new Schema({
  title: {
    type: String,
    required: [true, 'Title is required!']
  },
  body: {
    type: String,
    required: [true, 'Body is required!']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },

  likedPerson:
  {
    type : Array, "default":[]
  },
  likes:
  {
    type: Number ,default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  },
}, baseOptions, ), );

// model & export
module.exports = Post;
