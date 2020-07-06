var mongoose = require('mongoose');

// schema
var chatSchema = mongoose.Schema({
  users: { // push() the user._id when chatroom is created
    type: Array,
    default: []
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'comment'
  },
  text: {
    type: String,
    required: [true, 'text is required!']
  },
  isDeleted: {
    type: Boolean
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  },
}, {
  toObject: {
    virtuals: true
  }
});
