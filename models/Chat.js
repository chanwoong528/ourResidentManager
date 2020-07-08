var mongoose = require('mongoose');

// schema
var chatSchema =mongoose.Schema({
  log: [{
      text:
      {
        type:String,
        default:''
      },
      createdAt:
      {
        type: Date,
        default: Date.now
      },
  }]
});

var Chat = mongoose.model('chat',chatSchema);
module.exports = Chat;
