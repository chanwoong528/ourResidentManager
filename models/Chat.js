var mongoose = require('mongoose');

// schema
var chatSchema = mongoose.Schema({
  users: [{
    type: String
  }],
  log: [{
    username: {
      type: String,
      default:''
    },
    msg: {
      type: String,
      required: [true, "Log must contain (String) message!"]
    },
    time_stamp: {
      type: Date,
      default: Date.now
    },
    default: [{}]
  }]
});

/**
 * @param {string} username User document's username
 * @param {string} msg Message sent from a chatroom by a user
 * @param {Date} time Date + time when the message was sent
 */
chatSchema.methods.addToLog = function(username, msg, time) {
  this.log.push({ username: username }, { msg: msg }, { time_stamp: time });
  this.save(function(err) {
    if (err) console.log(err);
  });
};

chatSchema.methods.addAllToLog = function (logArr) {
  logArr.forEach((item, i) => {
    this.addToLog(item[0],item[1],item[2]);
  });
  this.save(function(err){
    if (err) console.log(err);
  });
};

/**
 * @returns log array saved in this chatroom, {string} username, {string} message, {date} time_stamp
 */
chatSchema.methods.getLog = function() {
  return this.log;
}

/**
 * @deprecated
 */
chatSchema.methods.addMsgToLog = function(msg) {
  this.log.push(msg);
  // console.log('--log: ' + this.log + '\n --msg: ' + msg);
  this.save(function(err) {
    if (err) console.log(err);
  });
};

/**
 * @deprecated
 */
chatSchema.methods.addMsgArrayToLog = function(msgArray) {
  msgArray.forEach((msg, i) => {
    this.log.push(msg);
  });
  this.save(function(err) {
    if (err) console.log(err);
  });
};

/**
 * @deprecated
 */
chatSchema.methods.getLogAsString = function() {
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
chatSchema.statics.findOneByUsernames = function(user1, user2, callback) {
  this.findOne({ users: { $all: [user1, user2] } }, (err, result) => {
    return result ? callback(err, result) : this.create({ users: [user1, user2] },
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
chatSchema.statics.findOneByChatIdString = function(chatId, callback) {
  var cid = mongoose.Types.ObjectId(chatId);
  this.findOne({ _id: cid },(err, result) => {
    return result ? callback(err, result) : -1;
  });
};

/**
 * @param {string} username User model's username
 * @returns set of Chat documents containing given username
 */
chatSchema.statics.findAllByUsername = function(username, callback) {
  return this.find({ username: { $elemMatch: { username } } }, callback);
};

var Chat = mongoose.model('chat', chatSchema);
module.exports = Chat;
