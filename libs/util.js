var util = {};

util.parseError = function(errors) {

  var parsed = {};
  if(errors.name == 'ValidationError'){
    for(var name in errors.errors){
      var validationError = errors.errors[name];
      parsed[name] = { message:validationError.message };
    }
  }
  else if(errors.code == '11000' ) {
      if( errors.errmsg.indexOf('username') > 0)
      {
        parsed.username = { message:'아이디가 중복됩니다.' };
      }
      if(errors.errmsg.indexOf('email') > 0)
      {
      parsed.email = {message:'이메일 중복됩니다'};
      }
  }

  else {
    parsed.unhandled = JSON.stringify(errors);
  }
  return parsed;
};
  util.isSuspended = function(req, res, next)
  {
    if(!req.user.suspended)
    {
      next();
    }
    else{
      req.logout();
      req.flash('errors', {login:'정지된 사용자는 이용하실 수 없습니다.'});

      return res.redirect('/login');

    }
  };
  util.isAdmin = function(req, res, next){
  if(req.user.isAdmin)
  {
    next();
  }
  else {
    req.flash('errors', {login:'관리자만 이용하실 수 있습니다.'});
    req.logout();
    res.redirect('/login');
  }
  };
  util.isVerified = function(req, res, next)
  {
    if(req.user.verified)
    {
      next();
    }
    else
    {
      req.flash('errors', {login:'인증된 사용자만 직거래 게시판을 이용할 수 있습니다.'});
      req.logout();
      res.redirect('/login');

    }

  };

util.isLoggedin = function(req, res, next){
  if(req.isAuthenticated()){
    next();
  }
  else {
    req.flash('errors', {login:'로그인 후 이용하실 수 있습니다.'});
    res.redirect('/login');
  }
};

util.noPermission = function(req, res){
  req.flash('errors', {login:"접근 권한이 없습니다."});
  req.logout();
  res.redirect('/login');
};

util.getPostQueryString = function(req, res, next){
  res.locals.getPostQueryString = function(isAppended=false, overwrites={}){
    var queryString = '';
    var queryArray = [];
    var page = overwrites.page?overwrites.page:(req.query.page?req.query.page:'');
    var limit = overwrites.limit?overwrites.limit:(req.query.limit?req.query.limit:'');

    if(page) queryArray.push('page='+page);
    if(limit) queryArray.push('limit='+limit);

    if(queryArray.length>0) queryString = (isAppended?'&':'?') + queryArray.join('&');

    return queryString;
  }
  next();
};


module.exports = util;
