var mongoose = require('mongoose');

// schema
var chatSchema = mongoose.Schema({
  users: { // push() the user._id when chatroom is created
    type: Array,
    default: []
  },
  
});
