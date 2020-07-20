var crypto = require('crypto');

/**
 * @returns randomly generated value to be used for client-server socket interactions.
 */

var algorithm = 'aes-256-ctr';
var password = 'd6F3Efeq';

module.exports = {
  generateKey: function() {
    var passKey = Math.random().toString(36).slice(2);
    //  Math.random().toString(36)  -> "0.uk02kso845o"
    //36 = 36진법: 숫자 0~9, 알파벳 -> "uk02kso845o"
    return passKey; //stringkey return
  },
  encryptKey: function(key) {
    var cipher = crypto.createCipher(algorithm, password);
    var crypted = cipher.update(key, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
  },

  decryptKey: function(key) {
    var decipher = crypto.createDecipher(algorithm, password);
    var dec = decipher.update(key, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  }
}

// var genkey = generateKey();
//
// console.log('orginal text:'+genkey);
//
// var encr = encryptKey(genkey);
// console.log('encrypt:'+encr);
//
// console.log('decrypt:'+decryptKey(encr));
