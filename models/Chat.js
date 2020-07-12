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
  log: [{
    type:String,
    default:''
  }]
});

chatSchema.methods.addMsgToLog = function(msg){
  this.log.push(msg);
  // console.log('--log: ' + this.log + '\n --msg: ' + msg);
  this.save(function (err){
    if (err) console.log(err);
  });
};

chatSchema.methods.addMsgArrayToLog = function(msgArray){
  msgArray.forEach((msg, i) => {
    this.log.push(msg);
  });
  this.save(function(err){
    if (err) console.log(err);
  });
};

chatSchema.methods.getLogAsString = function(){
  var ret = '';
  this.log.forEach((item, i) => {
    ret = ret.concat(item);
    ret = ret.concat('\n');
  });
  return ret;
};

/**
 * Find a Chat document with the given usernames.
 *
 * @param {string} user1 (also user2) User model's username in string.
 * @returns an error and a Chat document with both users as its members.
 *          If no match exists, then create one with the usernames.
 *          It can be accessed through callback, e.g., function(err,document).
 */
chatSchema.statics.findOneByUsernames = function (user1, user2, callback){
  this.findOne({users:{$all:[user1,user2]}}, (err, result) => {
    return result? callback(err,result):this.create({users:[user1,user2]},
      (err, result) => { return callback(err, result) });
  });
};

/**
 * Find a Chat document with the given chatId.
 *
 * @param {string} chatId Chat model's _id in string.
 * @returns an error and a Chat document with the matching _id.
 *          It can be accessed through callback, e.g., function(err,document).
 */
chatSchema.statics.findOneByChatIdString = function(chatId, callback){
  var cid = mongoose.Types.ObjectId(chatId);
  return this.findOne({_id:cid}, callback);
};

var Chat = mongoose.model('chat', chatSchema);
module.exports = Chat;
