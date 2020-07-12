var Logger = function (){

};
Logger.prototype.log = new Array();
Logger.prototype.getData = function (id){
  var data = Logger.prototype.log.find(e => e.includes(id));
  return data === undefined?-1:data;
}
Logger.prototype.init = function(socketId, chatId){
  var data = Logger.prototype.getData(chatId);
  if (data == -1){
    var set = [chatId, new Array(), socketId];
    Logger.prototype.log.push(set);
    return set[1];
  }
  else {
    if (!data.includes(socketId)) data.push(socketId);
    return data[1];
  }

}
Logger.prototype.appendLog = function(id, msg){
  var data = Logger.prototype.getData(id);
  data[1].push(msg);
  return data[1];
}
Logger.prototype.getChatId = function (socketId){
  var data = Logger.prototype.getData(socketId);
  return data[0];
}
Logger.prototype.getLogArray = function (chatId){
  var data = Logger.prototype.getData(chatId);
  return data[1];
}
Logger.prototype.flush = function (socketId){
  var data = Logger.prototype.getData(socketId);
  var ret = data[1];
  data[1] = new Array();
  // var i = Logger.prototype.log.indexOf(data);
  // Logger.prototype.log.splice(i,1);
  Logger.prototype.socketIdExpired(socketId);
  return ret;
}
Logger.prototype.socketIdExpired = function(socketId){
  var data = Logger.prototype.getData(socketId);
  if (data == -1){
    console.log(" @Logger: No such data containing socket: " + socketId)
    return -1;
  }
  var i = data.indexOf(socketId);
  data.splice(i,1);
  return 1;
}
Logger.prototype.removeChatEnrtybyChatId = function(chatId){
  // this should be triggered when both users exits chatroom
  // please check above status before using this function
  var data = Logger.prototype.getData(chatId);
  if (data == -1){
    console.log(" @Logger: No chat entry for: " + chatId);
    return -1;
  }
  var i = Logger.prototype.log.indexOf(data);
  Logger.prototype.log.splice(i,1);
  return 1;
}

module.exports = Logger;
