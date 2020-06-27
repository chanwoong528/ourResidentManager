var mongoose = require('mongoose');

// schema

var tradeSchema = mongoose.Schema({
  title:{type:String, required:[true,'Title is required!']},
  body:{type:String, required:[true,'Body is required!']},
  author:{type:mongoose.Schema.Types.ObjectId, ref:'user', required:true}, // 1
  createdAt:{type:Date, default:Date.now},
  updatedAt:{type:Date},
});

// model & export
var Trade = mongoose.model('trade', tradeSchema);
module.exports = Trade;
