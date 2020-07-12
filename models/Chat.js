var mongoose = require('mongoose');

// schema
var chatSchema = mongoose.Schema({
  users:[{
      type:String
      // Chat.findOne({users:{$all:["donkim1212","moon528"]}}, function(err, user){
      //   // TODO
      // });
      // // above will find Chat with donkim1212 and moon528 as chatroom users
  }],
  log: {
    type:[{
      _id: false,
      value:{
        type:String,
        default:''
      }
    }],
    default:[{}]
  }
});

var Chat = mongoose.model('chat', chatSchema);
module.exports = Chat;
