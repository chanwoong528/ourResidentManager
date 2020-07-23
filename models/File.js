// models/File.js

var mongoose = require('mongoose');
var fs = require('fs'); // 1
var path = require('path'); // 2

// Box client setting
var BoxSDK = require('box-node-sdk');
var client;
var boxClientId = 'rz1whi73fyvakiq0swamhgkkkptmedhn';
var boxAppToken = 'N0YdpZwrGyaGUByjG86BrSvzNKFyoWoU';
var isBoxEnabled = boxClientId && boxAppToken;

if(isBoxEnabled){
  var sdk = new BoxSDK({
    clientID: boxClientId,
    clientSecret: ''
  });
  client = sdk.getBasicClient(boxAppToken);
}

// schema
var fileSchema = mongoose.Schema({ // 1
  originalFileName:{type:String},
  serverFileName:{type:String},
  size:{type:Number},
  uploadedBy:{type:mongoose.Schema.Types.ObjectId, ref:'user', required:true},
  postId:{type:mongoose.Schema.Types.ObjectId, ref:'post'},
  isDeleted:{type:Boolean, default:false},
});


fileSchema.methods.processDelete = function(){ // 4
  this.isDeleted = true;
  this.save();
};


fileSchema.methods.getFileStream = async function(){
  if(isBoxEnabled){
    try{ // using box.com
      console.log(client);
      var stream = await client.files.getReadStream(this.serverFileId);
    }
    catch(err){
      if(err.statusCode == 404){
        console.log('cannot access api box!!!!');
        this.processDelete();
      }
      if (err.statusCode == 405){
        console.log('405 405 405 405 405');
        err.stack;
}
      console.log("알아볼수있게");
      throw(err.statusCode);
    }
    return stream;
  }
  else { // using server file system
    var stream;
    var filePath = path.join(__dirname,'..','uploadedFiles',this.serverFileName);
    var fileExists = fs.existsSync(filePath);
    if(fileExists){
      console.log('fileExists');
      stream = fs.createReadStream(filePath);
    }
    else {
      this.processDelete();
    }
    return stream;
  }
};


fileSchema.methods.bytesConversion = function(){
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  var bytes = this.size;
  if (bytes == 0) return '0 Byte';
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};

// model & export
var File = mongoose.model('file', fileSchema);

// model methods
// model methods
File.createNewInstance = async function(file, uploadedBy, postId){
  if(isBoxEnabled){ // using box.com
    var filePath = path.join(__dirname,'..','uploadedFiles',file.filename);
    var stream = fs.createReadStream(filePath);
    var boxResponse = await client.files.uploadFile('0', `${file.filename}_${file.originalname}`, stream);
    var uploadedFile = boxResponse.entries[0];

    return await File.create({
        originalFileName:file.originalname,
        serverFileName:file.filename,
        serverFileId:uploadedFile.id,
        size:file.size,
        uploadedBy:uploadedBy,
        postId:postId,
      });
  }
  else { // using server file system
    return await File.create({
        originalFileName:file.originalname,
        serverFileName:file.filename,
        size:file.size,
        uploadedBy:uploadedBy,
        postId:postId,
      });
  }
};


module.exports = File;
