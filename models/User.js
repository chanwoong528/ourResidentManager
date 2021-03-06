var mongoose = require('mongoose');
var bcrypt = require('bcryptjs'); // 1

// schema
var userSchema = mongoose.Schema({
  username:{
    type:String,
    required:[true,'아이디를 입력해주세요.'],
    match:[/^.{4,12}$/,'4글자 이상, 12글자 이하로 작성해주세요.'],
    trim:true,
    unique:[true, '아이디가 중복됩니다.']
  },
  password:{
    type:String,
    required:[true,'비밀번호를 입력해주세요.'],
    select:false
  },
  name:{
    type:String,
    required:[true,'인증을 위해 실명을 입력해주세요.'],
    trim:true
  },
  nickname:{
    type:String,
    required:[true,'사용하실 닉네임을 입력해주세요.'],
    unique:[true, '닉네임이 중복됩니다.'],
    trim:true
  },
  addr:{
    type:String,
    required:[true, '인증을 위해 정확한 동, 호 수를 입력해주세요.'],

  },
  email:{
    type:String,
    match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,'이메일 형식에 맞게 입력해주세요.'],
    unique: true,
    trim:true,
    requried: true
  },
  isAdmin:{
    type:Boolean, default:false
  },
  email_verified :{
      type: Boolean, default: false
  },
  verified:
  {
    type: Boolean, default :false

  },
  suspended:
  {
    type: Boolean, default : false
  },
  key_for_verify :{ type: String},
  activeChats:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'chat'
  }]
},{
  toObject:{virtuals:true}
});

/**
 * Converts given chatId string into mongoose.Types.ObjectId() and add it to
 *  the user's activeChats array (if it doesn't already have the same one).
 *
 * @param {User} user User document (i.e., userSchema) of a user
 *                  MUST BE VERIFIED BEFOREHAND, because this function won't type check.
 * @param {string} chatId string version of a chatId to be added
 */
userSchema.methods.addChat = function (user,chatId){
  var cid = mongoose.Types.ObjectId(chatId);
  if (!user.activeChats.includes(cid)){
    user.activeChats.push(cid);
    user.save(function(err){
      if (err) console.log(err);
    });
    return 1; // operation successful
  }
  return -1; // operation unsuccessful
}

/**
 * @param {User} user User document (i.e., userSchema) of a user
 *                  MUST BE VERIFIED BEFOREHAND, because this function won't type check.
 * @param {string} chatId string version of a chatId to be removed from user.activeChats
 */
userSchema.methods.removeChat = function(user,chatId){
  var cid = mongoose.Types.ObjectId(chatId);
  if (user.activeChats.includes(cid)){
    var i = user.activeChats.indexOf(cid);
    user.activeChats.splice(i,1);
    user.save(function(err){
      if (err) console.log(err);
    });
    return 1; // operation successful
  }
  return -1; // operation unsuccessful
}

userSchema.statics.findOneByUsername = function(username, callback){
  return this.findOne({username:username}, callback);
};

// virtuals
userSchema.virtual('passwordConfirmation')
  .get(function(){ return this._passwordConfirmation; })
  .set(function(value){ this._passwordConfirmation=value; });

userSchema.virtual('originalPassword')
  .get(function(){ return this._originalPassword; })
  .set(function(value){ this._originalPassword=value; });

userSchema.virtual('currentPassword')
  .get(function(){ return this._currentPassword; })
  .set(function(value){ this._currentPassword=value; });

userSchema.virtual('newPassword')
  .get(function(){ return this._newPassword; })
  .set(function(value){ this._newPassword=value; });

// password validation
var passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,16}$/;
var passwordRegexErrorMessage = '4 글자 이상의 영문 숫자 조합이어야 합니다.';
userSchema.path('password').validate(function(v)
{

  var user = this;


  // create user
  if(user.isNew){
      if(!user.passwordConfirmation){
        user.invalidate('passwordConfirmation', '비밀번호를 한번 더 입력해주세요.');
      }

      if(!passwordRegex.test(user.password)){
        user.invalidate('password', passwordRegexErrorMessage);
      }
      else if(user.password !== user.passwordConfirmation) {
        user.invalidate('passwordConfirmation', '비밀번호가 일치하지 않습니다.');
      }
    }
  // update user
  if(!user.isNew){
     if(!user.currentPassword){
       user.invalidate('currentPassword', '현재 사용중인 비밀번호를 입력해주세요.');
     }
     else if(!bcrypt.compareSync(user.currentPassword, user.originalPassword)){
       user.invalidate('currentPassword', '현재 비밀번호를 확인해주세요.');
     }

     if(user.newPassword && !passwordRegex.test(user.newPassword)){
       user.invalidate("newPassword", passwordRegexErrorMessage);
     }
     else if(user.newPassword !== user.passwordConfirmation) {
       user.invalidate('passwordConfirmation', '비밀번호가 일치 하지 않습니다.');
     }
   }
 });


 // hash password // 3
 userSchema.pre('save', function (next){
   var user = this;
   if(!user.isModified('password')){ // 3-1
     return next();
   }
   else {
     user.password = bcrypt.hashSync(user.password); //3-2
     return next();
   }
 });
 // model methods // 4
userSchema.methods.authenticate = function (password) {
  var user = this;
  return bcrypt.compareSync(password,user.password);
};
var User = mongoose.model('user',userSchema);
// model & export

module.exports = User;
