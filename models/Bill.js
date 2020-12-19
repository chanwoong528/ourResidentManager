var mongoose = require('mongoose');

// schema
var billSchema = mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required!']
  },
  body: {
    type: String,
    required: [true, 'Body is required!']
  },
  receiver: {
    type: String,
    ref: 'user',
    required: true
  },
  author: {
    type: String,
    ref: 'user',
    required: true
  },
  comment:
  {
    type: String, default: ''
  },
  attachment: {
    type: mongoose.Schema.Types.ObjectId, ref: 'file'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  updatedAt: {
    type: Date
  },
});


/**
 * @param {string} username User model's username
 * @returns set of Chat documents containing given username
 */
billSchema.statics.findAllByReceiver = function (receiver, callback) {
  return this.find({ "receiver": receiver }, callback);
};

billSchema.statics.findOneByReceiver = function (billId, callback) {
  return this.findOne({ "_id": billId }, callback).populate({ path: 'attachment', match: { isDeleted: false } });
};

billSchema.statics.findAll = function (callback){
  return this.find({}, callback);
};

var Bill = mongoose.model('bill', billSchema);
// model & export
module.exports = Bill;
