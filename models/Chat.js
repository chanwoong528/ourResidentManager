var mongoose = require('mongoose');

// schema
var chatSchema = mongoose.Schema({
  usernames: [{
    type: String
  }],
  nicknames: [{
    type: String
  }],
  user_data:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
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
    date: {
      type: Number,
      default: Date.now
    }
  }]
});

/**
 * @param {String} username User document's username
 * @param {String} msg Message sent from a chatroom by a user
 * @param {Number} date Date + time when the message was sent
 */
chatSchema.methods.addToLog = function(username, msg, date) {
  this.log.push([{ username: username }, { msg: msg }, { date: date }]);

};

chatSchema.methods.addAllToLog = function (data) {
  console.log('~on addAllToLog,');
  data.forEach((item, i) => {

    console.log('[' + i + '] item.username : ' + item.username);
    console.log('[' + i + '] item.msg      : ' + item.msg);
    console.log('[' + i + '] item.date     : ' + item.date);
    this.addToLog(item.username,item.msg.toString(),item.date);
  }); // when to save?
};

/**
 * @returns log array saved in this chatroom, {string} username, {string} message, {date} time_stamp
 */
chatSchema.methods.getDBLog = function(num) {
  return this.log;
}

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

chatSchema.statics.findOneByUsers = function(user1, user2, callback) {
  this.findOne({ user_data: { $all: [user1, user2] } }, (err, result) => {
    return result ? callback(err, result) : this.create({ user_data: [user1, user2] },
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
  this.findOne({ _id: cid }, (err, result) => {
    return result ? callback(err, result) : -1;
  });
  return this.findOne({ _id: cid }, callback);
};

/**
 * @param {string} username User model's username
 * @returns set of Chat documents containing given username
 */
chatSchema.statics.findAllByUsername = function(username, callback) {
  return this.find({ users: { $all: [username] } }, callback);
};

var Chat = mongoose.model('chat', chatSchema);
module.exports = Chat;
