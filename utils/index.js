function createUtils (lib) {
  'use strict';

  var zeroString = String.fromCharCode(0),
    oneString = String.fromCharCode(1);

  function nonValValue (thingy) {
    return lib.isVal(thingy) ? thingy : oneString;
  }
  function fromValue (thingy) {
    return thingy===oneString ? null : thingy;
  }
  function distincter (msgs, result, item) {
    var teststr, _mymsgs;
    if (!(item && item.from)) {
      return result;
    }
    teststr = nonValValue(item.from)
      +zeroString
      +nonValValue(item.from_role)
      +zeroString
      +nonValValue(item.from_realm)
      ;
    if (result.indexOf(teststr) < 0) {
      _mymsgs = [];
      result.push(teststr);
      msgs.add(teststr, _mymsgs);
    } else {
      _mymsgs = msgs.get(teststr);
    }
    if ('message' in item) {
      _mymsgs.push(lib.pick(item, ['id', 'message', 'created', 'seen']));
    }
    return result;
  };

  function breaker (msgs, str) {
    var sp = str.split(zeroString);
    return {
      from: fromValue(sp[0]),
      from_role: fromValue(sp[1]),
      from_realm: fromValue(sp[2]),
      messages: msgs.get(str)
    };
  }

  function distinctSenders (chats) {
    var temp, msgs, ret;

    if (!lib.isArray(chats)) {
      return [];
    }
    msgs = new lib.Map();
    temp = chats.reduce(distincter.bind(null, msgs), []);
    ret = temp.map(breaker.bind(null, msgs));
    msgs.destroy();
    msgs = null;
    return ret;
  }


  return {
    distinctSenders: distinctSenders
  };
}

module.exports = createUtils;
