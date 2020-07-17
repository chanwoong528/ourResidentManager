module.exports = {
  getDateAsString: function(dateNum) {
    var date = new Date(dateNum);
    // console.log(date.toString());
    var y = date.getFullYear();
    var m = addZero(date.getMonth() + 1);
    var d = addZero(date.getDate());
    var hh = addZero(date.getHours());
    var mm = addZero(date.getMinutes());
    return y + '-' + m + '-' + d + " | " + hh + ':' + mm;
  },
  addZero: addZero
}

function addZero(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

/**
 * @WIP
 */
function convertToTimeStamp(date) {
  var date1 = new Date('7/13/2010');
  var date2 = new Date(Date.now());

  var h = date.getHours();
  var g = h - 12;
  var i = (g < 0 || g == 12) ? '오전' : '오후';
  var hh = addZero((i == '오후') ? g : h);
  var mm = addZero(date.getMinutes());
  var ret = i + ' ' + hh + ':' + mm + ' | ';

  var diffTime = Math.abs(date2 - date);

  var diff = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
  var urn = (diff > 0) ? diff + '년 전' : '';
  if (urn != '') return ret + urn;

  diff = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
  urn = (diff > 0) ? diff + '달 전' : '';
  if (urn != '') return ret + urn;

  diff = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  urn = (diff > 1) ? diff + '일 전' : '';
  if (urn != '') return ret + urn;

  diff = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  urn = (diff > 1) ? diff + '일 전' : '';
  if (urn != '') return ret + urn;

  return ret + urn;
  console.log(diffTime + " milliseconds");
  console.log(diffDays + " days");

}
