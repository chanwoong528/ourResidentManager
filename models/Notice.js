var mongoose = require('mongoose');

// schema

var noticeSchema = mongoose.Schema({
  title:{type:String, required:[true,'Title is required!']},
  body:{type:String, required:[true,'Body is required!']},
  author:{type:mongoose.Schema.Types.ObjectId, ref:'user', required:true}, // 1
  createdAt:{type:Date, default:Date.now},
  updatedAt:{type:Date},
});

// model & export
var Notice = mongoose.model('notices', noticeSchema);
module.exports = Notice;
