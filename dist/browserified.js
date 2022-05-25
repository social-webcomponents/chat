(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function createChatMessageElement (lib, applib, templateslib, htmltemplateslib, chatweblib, messageparsinglib, jquerycontextmenulib, utils) {
  'use strict';

  var DataAwareElement = applib.getElementType('DataAwareElement'),
    ContextMenuMixin = jquerycontextmenulib.mixins.ContextMenu,
    o = templateslib.override,
    m = htmltemplateslib,
    HeartbeatHandlerMixin = chatweblib.mixins.HeartbeatHandler;

  function optionsstring (options, name, dflt) {
    var p, ret;
    if (!options) {
      return dflt;
    }
    ret = lib.readPropertyFromDotDelimitedString(options, name);
    return lib.isVal(ret) ? ret+' '+dflt : dflt;
  }
  
  function ChatMessageElement (id, options) {
    options.elements = options.elements || [];
    options.data_markup = options.data_markup || this.createDataMarkup(options.data_markup_options);
    DataAwareElement.call(this, id, options);
    ContextMenuMixin.call(this);
    HeartbeatHandlerMixin.call(this);
    this.MessageParser = new messageparsinglib.Parser();
    this.dontupdatebefore = Date.now();
  }
  lib.inherit(ChatMessageElement, DataAwareElement);
  ContextMenuMixin.addMethods(ChatMessageElement);
  HeartbeatHandlerMixin.addMethods(ChatMessageElement);
  ChatMessageElement.prototype.__cleanUp = function () {
    this.dontupdatebefore = null;
    if (this.MessageParser) {
      this.MessageParser.destroy();
    }
    this.MessageParser = null;
    HeartbeatHandlerMixin.prototype.destroy.call(this);
    ContextMenuMixin.prototype.destroy.call(this);
    DataAwareElement.prototype.__cleanUp.call(this);
  };
  ChatMessageElement.prototype.set_data = function (item) {
    var ret;
    if (item) {
      item.message = chatweblib.processMessage(item.message);
    }
    this.updateHumanReadableCreated(item);
    ret = DataAwareElement.prototype.set_data.call(this, item);
    return ret;
  };
  /**/
  ChatMessageElement.prototype.updateFromRcvd = function (rcvdmsg) {
    var mydata;
    //console.log('updateFromRcvd?', rcvdmsg);
    if (!(rcvdmsg && rcvdmsg.messageid)) {
      return;
    }
    mydata = this.get('data');
    updatercvdseen(mydata, 'rcvd', rcvdmsg);
    //console.log('gledajsad updateFromRcvd', mydata);
    this.set_data(mydata);
  };
  ChatMessageElement.prototype.updateFromSeen = function (seenmsg) {
    var mydata;
    //console.log('updateFromSeen?', seenmsg);
    if (!(seenmsg && seenmsg.messageid)) {
      return;
    }
    mydata = this.get('data');
    updatercvdseen(mydata, 'seen', seenmsg);
    //console.log('gledajsad updateFromSeen', mydata);
    this.set_data(mydata);
  };
  ChatMessageElement.prototype.updateFromEdit = function (editedmsg) {
    var mydata;
    if (!(editedmsg && editedmsg.message && editedmsg.moment)) {
      return;
    }
    mydata = this.get('data');
    if (!lib.isArray(mydata.edits)) {
      mydata.edits = [[mydata.message, mydata.created]];
    } else {
      mydata.edits.push([mydata.message, mydata.created]);
    }
    mydata.message = editedmsg.message;
    mydata.created = editedmsg.moment;
    this.set_data(mydata);
  };
  ChatMessageElement.prototype.updatePreview = function (preview) {
    var mydata;
    /*
    if (!(preview && (preview.title || preview.description || preview.image))) {
      return;
    }
    */
    mydata = this.get('data');
    mydata.preview = preview;
    this.set_data(mydata);
  };
  ChatMessageElement.prototype.parseMessage = function (message) {
    return this.MessageParser.parse(message);
  };
  ChatMessageElement.prototype.updateHumanReadableCreated = function (d, now) {
    var d, had_d, time;
    if (!this.destroyed) {
      return;
    }
    had_d = !!d;
    d = d || this.get('data');
    if (!(d && d.created)) {
      return;
    }
    time = d.lastedited || d.created;
    if (!had_d) {
      //this.updateHashField('created_humanreadable', ago(time));
      //console.log('oli messageago?', this.$element.find('.messageago')[0], '=>', ago(time));
      this.$element.find('.messageago').text(ago(time));
      //return;
    } else {
      d.created_humanreadable = ago(time);
    }
    this.dontupdatebefore = nextupdate(time, now);
    //lib.runNext(this.updateHumanReadableCreated.bind(this), nexttickinterval(d.created));
  };
  ChatMessageElement.prototype.createDataMarkup = function (options) {
    var mychatclass = optionsstring(options, 'class.mychat', 'mychat'),
      otherschatclass = optionsstring(options, 'class.otherschat', 'otherschat'),
      senderclass = optionsstring(options, 'class.sender', 'chatsender'),
      chatmessageclass = optionsstring(options, 'class.chatmessage', 'chatmessage'),
      messageagoclass = optionsstring(options, 'class.messageago', 'messageago'),
      messageeditedclass = optionsstring(options, 'class.messageedited', 'messageedited'),
      messageseenclass = optionsstring(options, 'class.messageseen', 'messageseen'),
      messagercvdclass = optionsstring(options, 'class.messagercvd', 'messagercvd'),
      retContent;

    retContent = [o(m.span,
      'CLASS', chatmessageclass,
      'CONTENTS', '{{this.parseMessage(item.message)}}'
    ),o(m.div,
      'CLASS', 'chatmessagepreview Preview',
      'ATTRS', 'style="display:{{(item.preview && (item.preview.title || item.preview.description || item.preview.image)) ? \'block\' : \'none\'}}"',
      'CONTENTS', [o(m.span,
        'CLASS', 'previewtitle Title',
        'ATTRS', 'style="display:{{(item.preview && item.preview.title) ? \'block\' : \'none\'}}"',
        'CONTENTS', '{{item.preview.title}}'
      ),o(m.span,
        'CLASS', 'previewdescription Description',
        'ATTRS', 'style="display:{{(item.preview && item.preview.description) ? \'block\' : \'none\'}}"',
        'CONTENTS', '{{item.preview.description}}'
      ),o(m.img,
        'CLASS', 'previewimage Image',
        'ATTRS', 'style="display:{{(item.preview && item.preview.image) ? \'block\' : \'none\'}}" {{this.previewDimension("width", item)}} {{this.previewDimension("height", item)}} src="{{item.preview.image}}"',
        'CONTENTS', '{{item.preview.description}}'
      )]
    ),o(m.div,
      'CLASS', 'chatmessagemetainfo',
      'CONTENTS', [o(m.span,
        'CLASS', messageeditedclass,
        'ATTRS', 'style="display:{{lib.isArray(item.edits) ? \'inline\' : \'none\'}}"',
        'CONTENTS', 'Edited'
      ),o(m.span,
        'CLASS', messageagoclass,
        'CONTENTS', '{{item.created_humanreadable}}'
      ),o(m.span,
        'CLASS', messagercvdclass,
        'ATTRS', 'style="display:{{(this.isMessageRcvd(item) && !this.isMessageSeen(item)) ? \'inline\' : \'none\'}}"',
        'CONTENTS', ''
      ),o(m.span,
        'CLASS', messageseenclass,
        'ATTRS', 'style="display:{{this.isMessageSeen(item) ? \'inline\' : \'none\'}}"',
        'CONTENTS', ''
      )]
    )];
    if (options && !options.skipSenderName){
      retContent.unshift(o(m.div,
        'CLASS', senderclass,
        'ATTRS', 'style="display:{{!!item.from ? \"block\" : \"none\"}}"',
        'CONTENTS', '{{item.from}}'
      ));
    }

    return o(m.div,
      'CLASS', '{{item.from===null ? "'+mychatclass+'" : "'+otherschatclass+'"}}',
      'CONTENTS', retContent 
    );
  };
  ChatMessageElement.prototype.previewDimension = function (dimname, item) {
    var propname;
    if (!(item && item.preview)) {
      return '';
    }
    propname = 'image'+lib.capitalize(dimname, true);
    if (!item.preview[propname]) {
      return;
    }
    return dimname+'="'+item.preview[propname]+'"';
  }
  ChatMessageElement.prototype.onContextMenu_edit = function () {
    this.__parent.__parent.doEdit(this.get('data'));
  };
  ChatMessageElement.prototype.handleHeartbeat = function (timestamp) {
    if (timestamp < this.dontupdatebefore) {
      return;
    }
    this.updateHumanReadableCreated(null, timestamp);
  };
  ChatMessageElement.prototype.isMessageSeen = function (item) {
    //console.log('isMessageSeen?', item);
    if (!item) {
      return false;
    }
    if (item.from !== null) {
      return false;
    }
    return lib.isArray(item.seenby) ? item.seenby.some(seener) : item.seen;
  };
  ChatMessageElement.prototype.isMessageRcvd = function (item) {
    //console.log('isMessageRcvd?', item);
    if (!item) {
      return false;
    }
    if (item.from !== null) {
      return false;
    }
    return lib.isArray(item.rcvdby) ? item.rcvdby.some(rcvder) : item.rcvd;
  };
  function seener (item) {
    return !!item.seen;
  }
  function rcvder (item) {
    return !!item.rcvd;
  }
  ChatMessageElement.prototype.containedMessageSeenByMe = function () {
    var d = this.get('data');
    if (!d) {
      return false;
    }
    if (d.from === null) {
      return true; //I sent this msg
    }
    if (d.seen) {
      return true;
    }
    if (lib.isArray(d.seenby)) {
      return d.seenby.some(hasmeseen);
    }
    return false;
  };
  function hasmeseen (seenbyitem) {
    return (seenbyitem.u===null && lib.isNumber(seenbyitem.seen));
  }
  function hasmeunseen (seenbyitem) {
    return (seenbyitem.u===null && seenbyitem.seen===null);
  }

  function ago (time, now) {
    var diff, prefix;
    now = now || Date.now();
    diff = now-time;
    prefix = (diff>0) ? '' : 'in the future';
    if (diff<0) {
      diff *= -1;
    }
    return rounded(diff)+' '+prefix;
  }

  function rounded (diff) {
    var is = lib.intervals, Day = 24*is.Hour, unit, ret;
    if (diff>Day) {
      ret = diff/Day;
      unit = 'd';
    }
    else if (diff>is.Hour) {
      ret = diff/is.Hour;
      unit = 'h';
    }
    else if (diff>is.Minute) {
      ret = diff/is.Minute;
      unit = 'm';
    }
    else if (diff>is.Second) {
      ret = diff/is.Second;
      unit = 's';
    }
    else {
      return 'Just now';
    }
    return Math.round(ret)+' '+unit+' '+'ago';
  }

  function nexttickinterval (time) {
    var now = Date.now(),
      diff = now-time,
      ret = Math.round(diff/3/1000)*1000;
    if (diff<lib.intervals.Second) {
      diff = lib.intervals.Second;
    }
    return ret;
  }

  function nextupdate (time, now) {
    now = now || Date.now();
    if (!lib.isNumber(time)) {
      return now+lib.intervals.Second;
    }
    if (now - time < lib.intervals.Minute) {
      return now+lib.intervals.Second;
    }
    if (now - time < lib.intervals.Hour) {
      return now+lib.intervals.Minute;
    }
    return now+lib.intervals.Hour;
  }

  function updatercvdseen (data, propname, msg) {
    var datapropname, prop, who, when;
    datapropname = propname+'by';
    who = msg[datapropname];
    when = msg[propname+'at'];
    prop = data[datapropname];
    if (lib.isArray(prop)) {
      prop.some(changer.bind(null, who, when, propname));
      who = null;
      when = null;
      propname = null;
      return;
    }
    if (who === '') { //other side's messages in p2p will not be updated dynamically
      data[propname] = when;
      return;
    }
  }

  function changer (who, when, propname, item) {
    if (item && item.u === who) {
      item[propname] = when;
    }
  }

  applib.registerElementType('ChatMessage', ChatMessageElement);
}

module.exports = createChatMessageElement;

},{}],2:[function(require,module,exports){
function createChatConversationBrief (lib, applib, templateslib, htmltemplateslib, chatweblib, utils) {
  'use strict';

  var DataAwareElement = applib.getElementType('DataAwareElement'),
    o = templateslib.override,
    p = templateslib.process,
    m = htmltemplateslib,
    ChatConversationBriefMixin = chatweblib.mixins.ChatConversationBrief,
    ChatActivityDisplayerMixin = chatweblib.mixins.ChatActivityDisplayer;


  function ChatConversationBriefElement (id, options) {
    DataAwareElement.call(this, id, options);
    ChatConversationBriefMixin.call(this);
    ChatActivityDisplayerMixin.call(this);
  }
  lib.inherit(ChatConversationBriefElement, DataAwareElement);
  ChatConversationBriefMixin.addMethods(ChatConversationBriefElement);
  ChatActivityDisplayerMixin.addMethods(ChatConversationBriefElement);
  ChatConversationBriefElement.prototype.__cleanUp = function () {
    ChatActivityDisplayerMixin.prototype.destroy.call(this);
    ChatConversationBriefMixin.prototype.destroy.call(this);
    DataAwareElement.prototype.__cleanUp.call(this);
  };
  ChatConversationBriefElement.prototype.set_data = function (data) {
    ChatConversationBriefMixin.prototype.handleConversationData.call(this, data);
    return DataAwareElement.prototype.set_data.call(this, data);
  };

  applib.registerElementType('ChatConversationBriefElement', ChatConversationBriefElement);

}

module.exports = createChatConversationBrief;

},{}],3:[function(require,module,exports){
function createChatConversationHistory (lib, applib, templateslib, htmltemplateslib, chatweblib, utils) {
  'use strict';

  var DataAwareElement = applib.getElementType('DataAwareElement'),
    DataElementFollowerMixin = applib.mixins.DataElementFollowerMixin,
    HeartbeatHandlerMixin = chatweblib.mixins.HeartbeatHandler;

  function ChatConversationHistoryElement (id, options) {
    DataAwareElement.call(this, id, options);
    DataElementFollowerMixin.call(this);
    HeartbeatHandlerMixin.call(this);
    this.needMessages = this.createBufferableHookCollection();
    this.messageSeen = this.createBufferableHookCollection();
    this.conversationChanged = this.createBufferableHookCollection();
    this.send = new lib.HookCollection();
    this.edit = new lib.HookCollection();
    this.active = new lib.HookCollection();
    this.childrenListeners = [];
    this.chatId = null;
    this.p2p = null;
    this.oldestMessageId = null;
  }
  lib.inherit(ChatConversationHistoryElement, DataAwareElement);
  DataElementFollowerMixin.addMethods(ChatConversationHistoryElement);
  HeartbeatHandlerMixin.addMethods(ChatConversationHistoryElement);
  ChatConversationHistoryElement.prototype.__cleanUp = function () {
    this.oldestMessageId = null;
    this.chatId = null;
    this.p2p = null;
    if (lib.isArray(this.childrenListeners)) {
      lib.arryDestroyAll(this.childrenListeners);
    }
    this.childrenListeners = null;
    if (this.active) {
      this.active.destroy();
    }
    this.active = null;
    if (this.edit) {
      this.edit.destroy();
    }
    this.edit = null;
    if (this.send) {
      this.send.destroy();
    }
    this.send = null;
    if (this.conversationChanged) {
      this.conversationChanged.destroy();
    }
    this.conversationChanged = null;
    if (this.messageSeen) {
      this.messageSeen.destroy();
    }
    this.messageSeen = null;
    if (this.needMessages) {
      this.needMessages.destroy();
    }
    this.needMessages = null;
    HeartbeatHandlerMixin.prototype.destroy.call(this);
    DataElementFollowerMixin.prototype.destroy.call(this);
    DataAwareElement.prototype.__cleanUp.call(this);
  };
  /*
  ChatConversationHistoryElement.prototype.set_actual = function (act) {
    var ret = DataAwareElement.prototype.set_actual.call(this, act);
    if (act) {
      this.getElement('Send').focusInABit();
    }
    return ret;
  };
  */
  ChatConversationHistoryElement.prototype.initChatConversationHistory = function () {
    var sendform;
    try {
      sendform = this.getElement('Send');
    } catch (e) {
      return;
    }
    //this.childrenListeners.push(sendform.attachListener('submit', this.onSendSubmit.bind(this)));
    this.childrenListeners.push(sendform.wantsSubmit.attach(this.onSendSubmit.bind(this)));
    this.childrenListeners.push(sendform.attachListener('active', this.onSendActive.bind(this)));
  };
  ChatConversationHistoryElement.prototype.onMasterDataChanged = function (data) {
    if (!lib.isVal(data)) {
      this.chatId = null;
      this.p2p = null;
      this.set('data', null);
      this.conversationChanged.fire(null);
      return;
    }
    if (data.id !== this.chatId && data.chatId !== this.chatId) {
      this.chatId = data.chatId || data.id;
      this.p2p = !!data.resolve;//data.conv.p2p;
      this.conversationChanged.fire(this.chatId);
      this.askForMessages();
    }
    console.log('history master data', data);
    this.set('data', data);
  };
  ChatConversationHistoryElement.prototype.askForMessages = function () {
    var oldest = lib.isNumber(this.oldestMessageId) ? this.oldestMessageId-1 : null;
    this.needMessages.fire({id: this.chatId, oldest: oldest, howmany: this.getConfigVal('pagesize')});
  };
  ChatConversationHistoryElement.prototype.detachFromChat = function () {
    this.__parent.detachActiveChat(); //this will trigger onMasterDataChanged(null)
  };
  ChatConversationHistoryElement.prototype.doEdit = function (msgdata) {
    var modes, send;
    msgdata.convid = this.chatId;
    try {
      modes = this.getElement('Modes');
      modes.set('actualchildren', 'Edit');
      modes.getElement('Edit').set('data', msgdata);
      send = this.getElement('Send');
      send.set('contents', msgdata.message);
      send.focus();
    } catch (ignore) {console.error(ignore);}
  };
  ChatConversationHistoryElement.prototype.doLink = function (msgdata) {
    var modes;
    msgdata.convid = this.chatId;
    try {
      modes = this.getElement('Modes');
      modes.set('actualchildren', 'Edit');
      modes.getElement('Link').set('data', msgdata);
    } catch (ignore) {console.error(ignore);}
  };
  ChatConversationHistoryElement.prototype.onSendSubmit = function (msg) {
    var modes;
    try {
      modes = this.getElement('Modes');
      this.fireOutMessage(msg, modes.get('actualchildren'));
      this.getElement('Send').resetForm();
      modes.set('actualchildren', null);
    } catch (ignore) {console.error(ignore);}
  };
  ChatConversationHistoryElement.prototype.fireOutMessage = function (msg, modes) {
    var mydata = this.get('data');
    if (lib.isString(modes)) {
      this.fireOutMessageBasedOnMode(mydata, msg, modes);
      return;
    }
    if (lib.isArray(modes)) {
      modes.forEach(this.fireOutMessageBasedOnMode.bind(this, mydata, msg));
      mydata = null;
      msg = null;
      return;
    }
    if (!(mydata && mydata.id)) {
      return;
    }
    this.send.fire(lib.extend({}, msg, {
      togroup: mydata.id,
      to: mydata.resolve || '',
      options: {
        preview: true //this "true" needs further elaboration
      }
    }));
  };
  ChatConversationHistoryElement.prototype.fireOutMessageBasedOnMode = function (mydata, msg, mode) {
    var editmodedata;
    if ('Edit' === mode ) {
      editmodedata = this.getElement('Modes').getElement('Edit').get('data');
      this.edit.fire(lib.extend({}, msg, editmodedata, {
        options: {
          preview: true
        }
      }));
    }
  };
  ChatConversationHistoryElement.prototype.onSendActive = function (ignore) {
    if (!this.chatId) {
      console.log('suppresing the active event because I have no chatId');
      return;
    }
    this.active.fire({
      convid: this.chatId
    });
  };
  ChatConversationHistoryElement.prototype.handleUserActive = function (useractiveobj) {
    //console.log(this.constructor.name, 'has yet to implement handleUserActive', useractiveobj);
    if (useractiveobj && useractiveobj.conversationid !== this.chatId) {
      return;
    }
    try {
      this.getElement('Header').showChatUserActivity(useractiveobj);
    } catch (e) {}
  };
  ChatConversationHistoryElement.prototype.handleHeartbeat = function (timestamp) {
    try {
      this.getElement('Messages').handleHeartbeat(timestamp);
    } catch (ignore) {}
  };
  ChatConversationHistoryElement.prototype.onMessageBoxFocused = function () {
    if (!this.get('actual')) {
      return;
    }
    if (!this.__parent) {
      return;
    }
    this.__parent.messageBoxFocused.fire(this);
  };
  ChatConversationHistoryElement.prototype.onMessageBoxBlurred = function () {
    if (!this.get('actual')) {
      return;
    }
    if (!this.__parent) {
      return;
    }
    this.__parent.messageBoxBlurred.fire(this);
  };

  ChatConversationHistoryElement.prototype.postInitializationMethodNames = ChatConversationHistoryElement.prototype.postInitializationMethodNames.concat(['initChatConversationHistory']);
  applib.registerElementType('ChatConversationHistory', ChatConversationHistoryElement);
}

module.exports = createChatConversationHistory;

},{}],4:[function(require,module,exports){
function createConversationHistoryHeaderElement (lib, applib, jquerylib, templateslib, htmltemplateslib, chatweblib, utils) {
  'use strict';

  var DataAwareChild = applib.getElementType('DataAwareChild'),
    ChatActivityDisplayerMixin = chatweblib.mixins.ChatActivityDisplayer;

  function ChatConversationHistoryHeaderElement (id, options) {
    DataAwareChild.call(this, id, options);
    ChatActivityDisplayerMixin.call(this);
  }
  lib.inherit(ChatConversationHistoryHeaderElement, DataAwareChild);
  ChatActivityDisplayerMixin.addMethods(ChatConversationHistoryHeaderElement);
  ChatConversationHistoryHeaderElement.prototype.__cleanUp = function () {
    ChatActivityDisplayerMixin.prototype.destroy.call(this);
    DataAwareChild.prototype.__cleanUp.call(this);
  };

  applib.registerElementType('ChatConversationHistoryHeaderElement', ChatConversationHistoryHeaderElement);
}
module.exports = createConversationHistoryHeaderElement;

},{}],5:[function(require,module,exports){
function createChatConversationMessages (lib, applib, jquerylib, templateslib, htmltemplateslib, chatweblib, utils) {
  'use strict';

  var FromDataCreator = applib.getElementType('FromDataCreator'),
    ScrollableMixin = jquerylib.mixins.Scrollable,
    HeartbeatHandlerMixin = chatweblib.mixins.HeartbeatHandler;

  function ChatConversationMessagesElement (id, options) {
    FromDataCreator.call(this, id, options);
    ScrollableMixin.call(this);
    HeartbeatHandlerMixin.call(this);
    this.needOlder = this.createBufferableHookCollection();
    this.messageSeen = this.createBufferableHookCollection();
    this.reportMessageSeen = new lib.DIContainer();
    this.oldestId = null;
    this.noOlder = null;
  }
  lib.inherit(ChatConversationMessagesElement, FromDataCreator);
  ScrollableMixin.addMethods(ChatConversationMessagesElement);
  HeartbeatHandlerMixin.addMethods(ChatConversationMessagesElement);
  ChatConversationMessagesElement.prototype.__cleanUp = function () {
    this.noOlder = null;
    this.oldestId = null;
    if (this.reportMessageSeen) {
      this.reportMessageSeen.destroy();
    }
    this.reportMessageSeen = null;
    if (this.messageSeen) {
      this.messageSeen.destroy();
    }
    this.messageSeen = null;
    if (this.needOlder) {
      this.needOlder.destroy();
    }
    this.needOlder = null;
    HeartbeatHandlerMixin.prototype.destroy.call(this);
    ScrollableMixin.prototype.destroy.call(this);
    FromDataCreator.prototype.__cleanUp.call(this);
  };
  ChatConversationMessagesElement.prototype.set_data = function (data) {
    var datavalid = lib.isArray(data) && data.length>0,
      ret;
    if (!datavalid) {
      this.oldestId = null;
      this.noOlder = null;
    }
    ret = FromDataCreator.prototype.set_data.call(this, data);
    lib.runNext(this.checkMessagesSeenability.bind(this));
    return ret;
  };
  ChatConversationMessagesElement.prototype.createFromArryData = function (data) {
    var initsubelcount = lib.isArray(this.subElements) ? this.subElements.length : 0,
      finalsubelcount,
      initoldest = this.oldestId,
      finaloldest,
      wasatbottom = this.elementIsScrolledToBottom(),
      ret;
    ret = FromDataCreator.prototype.createFromArryData.call(this, data);
    finalsubelcount = lib.isArray(this.subElements) ? this.subElements.length : 0;
    finaloldest = this.oldestId;
    if (initsubelcount === finalsubelcount) {
      return;
    }
    //if (initsubelcount === 0 || (initoldest !== finaloldest)) {
    if (initsubelcount===0 || wasatbottom) {
      console.log('scrollElementToBottom!');
      this.scrollElementToBottom();
      return ret;
    }
    return ret;
  };
  ChatConversationMessagesElement.prototype.createFromArryItem = function (item) {
    if (item.oldest) {
      this.noOlder = true;
    }
    this.assignOldestId(item.id);
    return FromDataCreator.prototype.createFromArryItem.call(this, item);
  };
  ChatConversationMessagesElement.prototype.assignOldestId = function (id) {
    if (!lib.isNumber(this.oldestId)) {
      this.oldestId = id;
      return;
    }
    if (this.oldestId>id) {
      this.oldestId = id;
    }
  };
  ChatConversationMessagesElement.prototype.onElementScrolled = function () {
    this.checkMessagesSeenability();
    ScrollableMixin.prototype.onElementScrolled.apply(this, arguments);
  };
  ChatConversationMessagesElement.prototype.onElementScrolledToTop = function () {
    if (!this.noOlder) {
      this.needOlder.fire(this.oldestId);
    }
  };

  ChatConversationMessagesElement.prototype.checkMessagesSeenability = function () {
    if (!(lib.isArray(this.subElements) && this.subElements.length>0)) {
      return;
    }
    this.subElements.forEach(this.checkSingleMessageSeenability.bind(this));
  };

  ChatConversationMessagesElement.prototype.checkSingleMessageSeenability = function (chld) {
    var cd;
    cd = chld.get('data');
    if (!(chld && chld.$element)) {
      return;
    }
    if (chld.containedMessageSeenByMe()) {
      return;
    }
    if (this.elementIsWithinTheScrollableArea(chld.$element)) {
      this._doTheMessageSeenReporting(cd);
    }
  };

  ChatConversationMessagesElement.prototype._doTheMessageSeenReporting = function (msg) {
    var mymsgseen = {
      messageid: msg.id,
      seenby: null,
      seenat: Date.now()
    },
    mymsgrcvd = {
      messageid: msg.id,
      rcvdby: null,
      rcvdat: Date.now()
    };
    this.doSeenMessage(mymsgseen);
    this.doRcvdMessage(mymsgrcvd);
    this.messageSeen.fire(msg.id);
  };

  ChatConversationMessagesElement.prototype.doRcvdMessage = function (rcvdm) {
    this.findElementAndApply(rcvdm, 'messageid', 'updateFromRcvd');
  };
  ChatConversationMessagesElement.prototype.doSeenMessage = function (seenm) {
    this.findElementAndApply(seenm, 'messageid', 'updateFromSeen');
  };
  ChatConversationMessagesElement.prototype.doEditMessage = function (editedm) {
    this.findElementAndApply(editedm, 'id', 'updateFromEdit');
  };
  ChatConversationMessagesElement.prototype.findElementAndApply = function (msg, propname4find, methodname) {
    var affectedwi = lib.arryOperations.findElementAndIndexWithProperty(this.subElements, 'id', 'chatmessage_'+msg[propname4find]), elem;
    if (!(affectedwi && affectedwi.element)) {
      return;
    }
    elem = affectedwi.element;
    //affectedwi.element[methodname](msg);
    lib.runNext(elem[methodname].bind(elem, msg));
    elem = null;
    msg = null;
  };

  ChatConversationMessagesElement.prototype.doPreviewMessage = function (preview) {
    var affectedwi = lib.arryOperations.findElementAndIndexWithProperty(this.subElements, 'id', 'chatmessage_'+preview.id);
    if (!(affectedwi && affectedwi.element)) {
      return;
    }
    affectedwi.element.updatePreview(preview);
  };

  applib.registerElementType('ChatConversationMessages', ChatConversationMessagesElement);
}

module.exports = createChatConversationMessages;

},{}],6:[function(require,module,exports){
function createChatConversationsElement (lib, applib, jquerylib, templateslib, htmltemplateslib, utils) {
  'use strict';

  function ChldWithListener (chatrepresentselem, chld) {
    this.chld = chld;
    this.chldSelectedListener = chld.selected.attach(chatrepresentselem.onChldSelected.bind(chatrepresentselem));
  }
  ChldWithListener.prototype.destroy = function () {
    if (this.chldSelectedListener) {
      this.chldSelectedListener.destroy();
    }
    this.chldSelectedListener = null;
    if (this.chld) {
      this.chld.destroy();
    }
    this.chld = null;
  };
  ChldWithListener.prototype.get = function (propname) {
    if (!this.chld) {
      return null;
    }
    return this.chld.get(propname);
  };
  ChldWithListener.prototype.set = function (propname, val) {
    if (!this.chld) {
      return false;
    }
    return this.chld.set(propname, val);
  };

  var FromDataCreator = applib.getElementType('FromDataCreator'),
    ScrollableMixin = jquerylib.mixins.Scrollable;

  function ChatConversationsElement (id, options) {
    FromDataCreator.call(this, id, options);
    ScrollableMixin.call(this);
    this.selected = this.createBufferableHookCollection();
    this.needGroupCandidates = this.createBufferableHookCollection();
    this.selectedItemId = null;
  }
  lib.inherit(ChatConversationsElement, FromDataCreator);
  ScrollableMixin.addMethods(ChatConversationsElement);
  ChatConversationsElement.prototype.__cleanUp = function () {
    this.selectedItemId = null;
    if (this.needGroupCandidates){
      this.needGroupCandidates.destroy();
    }
    this.needGroupCandidates = null;
    if (this.selected) {
      this.selected.destroy();
    }
    this.selected = null;
    ScrollableMixin.prototype.destroy.call(this);
    FromDataCreator.prototype.__cleanUp.call(this);
  };
  ChatConversationsElement.prototype.set_data = function (data) {
    var ret = FromDataCreator.prototype.set_data.call(this, data);
    /*
    console.log(this.$element.find('.match-container').filter(hasdataer));
    */
    //console.log(this.config);
    this.$element.find('.match-container').filter(hasdataer).sort(
      chatsorter
    ).appendTo(this.$element.find('.hers-representatives'));
    return ret;
  };
  ChatConversationsElement.prototype.onChldSelected = function (chld) {
    this.selectedItemId = chld ? chld.id : null;
    this.selected.fire(chld);
  };
  ChatConversationsElement.prototype.destructableForSubElements = function (chld) {
    if (this.selectedItemId && chld && chld.id===this.selectedItemId) {
      this.selected.fire(chld);
    }
    return new ChldWithListener(this, chld);
  };
  ChatConversationsElement.prototype.forgetSelected = function () {
    this.selectedItemId = null;
  };
  ChatConversationsElement.prototype.handleUserActive = function (useractiveobj) {
    this.traverseSubElementsWithFilter({
      op: 'eq',
      field: 'id',
      value: useractiveobj.conversationid
    }, useractiver.bind(null, useractiveobj));
    useractiveobj = null;
  };
  ChatConversationsElement.prototype.handleMessageSeen = function (seenobj) {
    console.log(this.constructor.name, 'handleMessageSeen', seenobj, this.get('data'));
    this.traverseSubElementsWithFilter({
      op: 'eq',
      field: 'id',
      value: seenobj.convid
    }, chldmsgseener);
  };
  function useractiver (useractiveobj, chld, isok) {
    if (!isok) {
      return;
    }
    chld.chld.showChatUserActivity(useractiveobj);
  }
  function chldmsgseener (chld, isok) {
    if (!isok) {
      return;
    }
    //console.log('chldmsgseener', chld.chld);
    chld.chld.maybeDecreaseUnreadMessages();
  }
  function chatsorter (a, b) {
    var ad = jQuery(a).data('chat'), bd = jQuery(b).data('chat');
    var acrit = ad && ad.conv && ad.conv.lastm && ad.conv.lastm.created ? ad.conv.lastm.created : 0,
      bcrit = bd && bd.conv && bd.conv.lastm && bd.conv.lastm.created ? bd.conv.lastm.created : 0;
    return bcrit-acrit;
  }
  function hasdataer (index, e) {
    return !!jQuery(e).data('chat');
  }

  applib.registerElementType('ChatConversationsElement', ChatConversationsElement);
}

module.exports = createChatConversationsElement;

},{}],7:[function(require,module,exports){
function createElements (lib, applib, jquerylib, templateslib, htmltemplateslib, chatweblib, messageparsinglib, jquerycontextmenulib, bufftriglib, utils) {
  'use strict';

  require('./interfacecreator')(lib, applib, templateslib, htmltemplateslib, chatweblib, utils);
  require('./chatmessagecreator')(lib, applib, templateslib, htmltemplateslib, chatweblib, messageparsinglib, jquerycontextmenulib, utils);
  require('./conversationbriefcreator')(lib, applib, templateslib, htmltemplateslib, chatweblib, utils);
  require('./conversationscreator')(lib, applib, jquerylib, templateslib, htmltemplateslib, utils);
  require('./conversationhistorycreator')(lib, applib, templateslib, htmltemplateslib, chatweblib, utils);
  require('./conversationhistoryheadercreator')(lib, applib, jquerylib, templateslib, htmltemplateslib, chatweblib, utils);
  require('./conversationmessagescreator')(lib, applib, jquerylib, templateslib, htmltemplateslib, chatweblib, utils);
  require('./modescreator')(lib, applib, jquerylib, templateslib, htmltemplateslib, utils);
  require('./sendformcreator')(lib, applib, jquerylib, templateslib, htmltemplateslib, bufftriglib, utils);
}

module.exports = createElements;

},{"./chatmessagecreator":1,"./conversationbriefcreator":2,"./conversationhistorycreator":3,"./conversationhistoryheadercreator":4,"./conversationmessagescreator":5,"./conversationscreator":6,"./interfacecreator":8,"./modescreator":9,"./sendformcreator":10}],8:[function(require,module,exports){
function createChatInterface (lib, applib, templateslib, htmltemplateslib, chatweblib, utils) {
  'use strict';

  var WebElement = applib.getElementType('WebElement'),
    ChatInterfaceMixin = chatweblib.mixins.Interface;

  function ChatInterfaceElement (id, options) {
    WebElement.call(this, id, options);
    ChatInterfaceMixin.call(this);
    this.data = null;
  }
  lib.inherit(ChatInterfaceElement, WebElement);
  ChatInterfaceMixin.addMethods(ChatInterfaceElement);
  ChatInterfaceElement.prototype.__cleanUp = function () {
    this.data = null;
    ChatInterfaceMixin.prototype.destroy.call(this);
    WebElement.prototype.__cleanUp.call(this);
  };
  applib.registerElementType('ChatInterface', ChatInterfaceElement);

}
module.exports = createChatInterface;

},{}],9:[function(require,module,exports){
function createModes (lib, applib, jquerylib, templateslib, htmltemplateslib, utils) {
  'use strict';

  var WebElement = applib.getElementType('WebElement'),
    ChildActualizerMixin = applib.mixins.ChildActualizer,
    o = templateslib.override,
    m = htmltemplateslib;

  function createDefaultMarkup (options) {
    return o(m.div,
      'CLASS', 'hers-modes',
      'CONTENTS', [
        o(m.div,
          'CLASS', 'Link hers-modes-link',
          'CONTENTS', [
            o(m.div,
              'CLASS', 'Contents hers-modes-link-contents'
            ),
            o(m.div,
              'CLASS', 'Cancel hers-modes-cancel',
              'CONTENTS', o(m.span,
                'CLASS', 'icon-preferences'
              )
            )
          ]
        ),
        o(m.div,
          'CLASS', 'Edit hers-modes-edit',
          'CONTENTS', [
            o(m.div,
              'CLASS', 'hers-modes-edit-container',
              'CONTENTS', [
                o(m.span,
                  'CLASS', 'hers-modes-edit-label',
                  'CONTENTS' ,'Edit message'
                ),
                o(m.span,
                  'CLASS', 'Contents hers-modes-edit-contents'
                )
              ]
            ),
            o(m.div,
              'CLASS', 'Cancel hers-modes-cancel',
              'CONTENTS', o(m.span,
                'CLASS', 'icon-preferences'
              )
            )
          ]
        )
      ]
    );
  }

  function ChatModeElement (id, options) {
    options.elements = options.elements || [];
    options.elements.push({
      name: 'Cancel',
      type: 'ClickableElement',
      options: {
        actual: true,
        self_selector: '.',
        ignore_enabled: true
      }
    });
    WebElement.call(this, id, options);
    this.data = null;
  }
  lib.inherit(ChatModeElement, WebElement);
  ChatModeElement.prototype.__cleanUp = function () {
    this.data = null;
    WebElement.prototype.__cleanUp.call(this);
  };
  ChatModeElement.prototype.set_data = function (val) {
    this.data = val;
  };

  applib.registerElementType('ChatModeElement', ChatModeElement);

  function ChatModeWithContentsElement (id, options) {
    ChatModeElement.call(this, id, options);
  }
  lib.inherit(ChatModeWithContentsElement, ChatModeElement);
  ChatModeWithContentsElement.prototype.__cleanUp = function () {
    ChatModeElement.prototype.__cleanUp.call(this);
  };
  ChatModeWithContentsElement.prototype.set_contents = function (val) {
    //simple - for now
    if (!this.$element) {
      return;
    }
    this.$element.find('.Contents').text(val);
  };
  ChatModeWithContentsElement.prototype.get_contents = function () {
    if (!this.$element) {
      return;
    }
    return this.$element.find('.Contents').text();
  };

  applib.registerElementType('ChatModeWithContentsElement', ChatModeWithContentsElement);

  function ChatEditModeElement (id, options) {
    ChatModeWithContentsElement.call(this, id, options);
  };
  lib.inherit(ChatEditModeElement, ChatModeWithContentsElement);
  ChatEditModeElement.prototype.set_data = function (val) {
    ChatModeWithContentsElement.prototype.set_data.call(this, val);
    this.set('contents', val.message);
  };

  applib.registerElementType('ChatEditModeElement', ChatEditModeElement);

  function ChatModesElement (id, options) {
    options.default_markup = options.default_markup || createDefaultMarkup (options.defaultmarkupoptions);
    options.elements = [{
      name: 'Link',
      type: 'ChatModeWithContentsElement',
      options: {
        self_selector: '.'
      }
    },{
      name: 'Edit',
      type: 'ChatEditModeElement',
      options: {
        self_selector: '.'
      }
    }]
    WebElement.call(this, id, options);
    ChildActualizerMixin.call(this);
  }
  lib.inherit(ChatModesElement, WebElement);
  ChildActualizerMixin.addMethods(ChatModesElement);
  ChatModesElement.prototype.__cleanUp = function () {
    ChildActualizerMixin.prototype.destroy.call(this);
    WebElement.prototype.__cleanUp.call(this);
  };

  applib.registerElementType('ChatModesElement', ChatModesElement);
}
module.exports = createModes;


},{}],10:[function(require,module,exports){
function createSendForm (lib, applib, jquerylib, templateslib, htmltemplateslib, bufftriglib, utils) {
  'use strict';

  var FormLogic = applib.getElementType('FormElement'), // applib.getElementType('FormLogic'),
    BufferedTrigger = bufftriglib.BufferedTrigger;

  function SendChatMessageFormLogic (id, options) {
    options = options || {};
    options.elements = options.elements || [];
    options.elements.push({
      name: 'message_text',
      type: 'PlainHashFieldElement',
      options: {
        actual: true,
        self_selector: 'attrib:name',
        hashfield: 'message_text',
        fieldname: 'message_text'
      }
    },{
      name: 'SendSubmit',
      type: 'ClickableElement',
      options: {
        actual: true,
        self_selector: '.'
      }
    });
    FormLogic.call(this, id, options);
    this.trigger = new BufferedTrigger(this.fireActive.bind(this), options.input_timeout||5000);
    this.active = this.createBufferableHookCollection();
    this.focuser = this.onMessageBoxFocused.bind(this);
    this.blurrer = this.onMessageBoxBlurred.bind(this);
    this.clicker = this.onButtonClicked.bind(this);
  }
  lib.inherit(SendChatMessageFormLogic, FormLogic);
  SendChatMessageFormLogic.prototype.__cleanUp = function () {
    this.buttonElementOperation('off', 'blur', this.clicker);
    this.messageBoxElementOperation('off', 'blur', this.blurrer);
    this.messageBoxElementOperation('off', 'focus', this.focuser);
    this.clicker = null;
    this.blurrer = null;
    this.focuser = null;
    if (this.active) {
      this.active.destroy();
    }
    this.active = null;
    if (this.trigger) {
      this.messageBoxElementOperation('off', 'keyup', this.trigger.triggerer);
      this.trigger.destroy();
    }
    this.trigger = null;
    FormLogic.prototype.__cleanUp.call(this);
  };
  SendChatMessageFormLogic.prototype.staticEnvironmentDescriptor = function (myname) {
    return {
      links: [{
        source: 'element.'+myname+':valid',
        target: 'element.'+myname+'.SendSubmit:enabled'
      },{
        source: 'element.'+myname+'.SendSubmit!clicked',
        target: 'element.'+myname+'>fireSubmit',
        filter: function (thingy) {
          return thingy;
        }
      }]
    };
  };
  SendChatMessageFormLogic.prototype.resetForm = function () {
    if (this.trigger) {
      this.trigger.clearTimeout();
    }
    FormLogic.prototype.resetData.call(this);
  };
  SendChatMessageFormLogic.prototype.set_contents = function (val) {
    if (!this.$element) {
      return null;
    }
    this.$element.find('[name="message_text"]').val(val);
    return true;
  };
  SendChatMessageFormLogic.prototype.get_contents = function () {
    if (!this.$element) {
      return null;
    }
    return this.$element.find('[name="message_text"]').val();
  };
  SendChatMessageFormLogic.prototype.focus = function () {
    this.messageBoxElementOperation('focus');
  };
  SendChatMessageFormLogic.prototype.initSendChatMessageFormLogic = function () {
    if (this.trigger) {
      //this.$element.find('[name="message_text"]').on('keyup', this.trigger.triggerer);
      this.messageBoxElementOperation('on', 'keyup', this.trigger.triggerer);
    }
    this.messageBoxElementOperation('on', 'focus', this.focuser);
    this.messageBoxElementOperation('on', 'blur', this.blurrer);
    this.buttonElementOperation('on', 'click', this.clicker);
  };
  SendChatMessageFormLogic.prototype.buttonElementOperation = function () {
    var bel;
    if (!this.$element) {
      return null;
    }
    bel = this.$element.find('button');
    if (!(bel && bel.length>0)) {
      return null;
    }
    return bel[arguments[0]].apply(bel, Array.prototype.slice.call(arguments, 1));
  };
  SendChatMessageFormLogic.prototype.messageBoxElementOperation = function () {
    var mbel;
    if (!this.$element) {
      return null;
    }
    mbel = this.$element.find('[name="message_text"]');
    if (!(mbel && mbel.length>0)) {
      return null;
    }
    return mbel[arguments[0]].apply(mbel, Array.prototype.slice.call(arguments, 1));
  };
  SendChatMessageFormLogic.prototype.fireActive = function () {
    console.log('typing!');
    if (this.active) {
      this.active.fire(true);
    }
  };
  SendChatMessageFormLogic.prototype.onMessageBoxFocused = function () {
    if (!this.get('actual')) {
      return;
    }
    if (!this.__parent) {
      return;
    }
    this.__parent.onMessageBoxFocused();
  };
  SendChatMessageFormLogic.prototype.onMessageBoxBlurred = function () {
    if (!this.get('actual')) {
      return;
    }
    if (!this.__parent) {
      return;
    }
    this.__parent.onMessageBoxBlurred();
  };
  SendChatMessageFormLogic.prototype.onButtonClicked = function () {
    this.messageBoxElementOperation('focus');
  };
  SendChatMessageFormLogic.prototype.focusInABit = function () {
    console.log('focusInABit');
    lib.runNext(this.messageBoxElementOperation.bind(this, 'focus'), 20);
  };

  SendChatMessageFormLogic.prototype.postInitializationMethodNames = SendChatMessageFormLogic.prototype.postInitializationMethodNames.concat(['initSendChatMessageFormLogic']);

  applib.registerElementType('SendChatMessageFormLogic', SendChatMessageFormLogic);
}
module.exports = createSendForm;

},{}],11:[function(require,module,exports){
(function createChatWebComponent (execlib) {

  var lib = execlib.lib,
    lR = execlib.execSuite.libRegistry,
    applib = lR.get('allex_applib'),
    jquerylib = lR.get('allex_jqueryelementslib'),
    jquerycontextmenulib = lR.get('allex_jquerycontextmenuweblib'),
    templateslib = lR.get('allex_templateslitelib'),
    htmltemplateslib = lR.get('allex_htmltemplateslib'),
    chatweblib = lR.get('social_chatweblib'),
    messageparsinglib = lR.get('social_messageparsinglib'),
    bufftriglib = lR.get('allex_bufferedtriggerlib'),
    utils = require('./utils')(lib);

  require('./elements')(lib, applib, jquerylib, templateslib, htmltemplateslib, chatweblib, messageparsinglib, jquerycontextmenulib, bufftriglib, utils);
  require('./modifiers')(lib, applib, templateslib, htmltemplateslib, utils);
  require('./prepreprocessors')(lib, applib);
})(ALLEX);

},{"./elements":7,"./modifiers":14,"./prepreprocessors":15,"./utils":17}],12:[function(require,module,exports){
function createChatWidget (lib, applib, templateslib, htmltemplateslib, utils) {
  'use strict';

  var o = templateslib.override,
    m = htmltemplateslib,
    p = templateslib.process,
    BasicModifier = applib.BasicModifier,
    zeroString=String.fromCharCode(0);

  var __SENTMESSAGECOUNT=0;

  function createUnreadChatMessages(){
    return o(m.div,
      'CONTENTS', [
        o(m.h3,
          'CONTENTS', 'Unread Messages:',
        ),
        o(m.div,
          'ATTRS', 'data-ng-repeat="message in _ctrl.data"',
          'CONTENTS', '{{message}}'
        )
      ]
    );
  }

  function createSendMessageForm(config){
    if (!config){
      config = {};
    }
    if (!config.class){
      config.class = {};
    }
    var ret = o(m.form,
      'CLASS', (config.class.form || ''),
      'CONTENTS', [
        /*
        o(m.textinput,
          'NAME', 'to',
          'ATTRS', 'placeholder="To" required="required"'
        ),
        */
        o(m.textarea,
          'NAME', 'message_text',
          'ATTRS', 'placeholder="Write a message..." required="required"',
          'CLASS', (config.class.textarea || '')
        ),
        o(m.button,
          'CLASS', 'SendSubmit' + (config.class.button ? ' ' + config.class.button : ''),
          'CONTENTS', 'Send'
        )
      ]
    );
    return ret;
  }

  function ChatWidgetModifier (options) {
    BasicModifier.call(this, options);
  }
  lib.inherit(ChatWidgetModifier, BasicModifier);
  ChatWidgetModifier.prototype.doProcess = function (name, options, links, logic, resources) {
    var config = this.config || {},
      widgetname,
      chatsname,
      historyname;

    config.widget = config.widget || {};
    config.types = config.types || {};
    config.names = config.names || {};

    widgetname = config.widget.name || config.names.interface || 'Chat';
    chatsname = config.names.chats || 'Chats';
    historyname = config.names.history || 'ChatHistory';
      
    options.elements.push({
      name: widgetname,
      type: config.types.interface || 'ChatInterface',
      options: this.widgetOptions(config.widget, config.types, config.names),
      logic: [{
        triggers: '.:lastnotification',
        references: '.,.'+historyname+'.Messages',
        handler: function (me, msgs, ln) {
          //console.log('lastnotification', ln);
          if (!(me && me.activechat && (me.activechat.id === ln.id || me.activechat.chatId === ln.id))) {
            return;
          }
          if (ln && ln.conv) {
            if (ln.conv.rcvdm) {
              msgs.doRcvdMessage(ln.conv.rcvdm);
              return;
            }
            if (ln.conv.seenm) {
              msgs.doSeenMessage(ln.conv.seenm);
              return;
            }
            if (ln.conv.editedm) {
              msgs.doEditMessage(ln.conv.editedm);
              return;
            }
            if (ln.conv.preview) {
              msgs.doPreviewMessage(ln.conv.preview);
              return;
            }
            if (ln.conv.lastm) {
              msgs.appendData([ln.conv.lastm]);
            }
          }
        }
      },{
        triggers: '.!userActive',
        references: '.'+chatsname+',.'+historyname,
        handler: function (chats, hist, evnt) {
          console.log('distributing userActive', evnt);
          chats.handleUserActive(evnt);
          hist.handleUserActive(evnt);
        }
      }],
      links: [{
        source: '.:data',
        target: chatsname+':data',
        //filter: utils.distinctSenders
      },{
        source: '.'+chatsname+'!selected',
        target: '.>handleSelectedChat'
        //target: '.:activechat'
      },{
        source: '.!forgetSelected',
        target: '.'+chatsname+'>forgetSelected'
      },{
        source: '.!messageSeen',
        target: '.'+chatsname+'>handleMessageSeen'
      },{
        source: '.'+chatsname+'!needGroupCandidates',
        target: '.!needGroupCandidates'
      },{
        source: '.:activechat',
        target: '.'+historyname+':datamaster'
      },{
        source: '.:chatmessages',
        target: '.'+historyname+'.Messages>prependData'
      },{
        source: '.'+historyname+'!conversationChanged',
        target: '.:chatmessages',
        filter: function () {
          return null;
        }
      },{
        source: '.'+historyname+'!messageSeen',
        target: '.>handleMessageSeen'
      },{
        source: '.'+historyname+'!needMessages',
        target: '.!needMessages'
      },{
        source: '.'+historyname+'!send',
        target: '.!messageToSend'
      },{
        source: '.'+historyname+'!edit',
        target: '.!messageToEdit'
      },{
        source: '.'+historyname+'!active',
        target: '.!active'
      },{
        source: '.!heartbeat',
        target: '.'+historyname+'>handleHeartbeat'
      }]
    });
  };
  ChatWidgetModifier.prototype.widgetOptions = function (params, types, names) {
    var chatsname,
      historyname,
      createchatgroupname,
      chatgroupcreatorname,
      elements,
      conversationselements;
    params = params || {};

    names = names || {};

    chatsname = names.chats || 'Chats';
    historyname = names.history || 'ChatHistory';
    createchatgroupname = names.createchatgroup || 'CreateChatGroup';
    chatgroupcreatorname = names.chatgroupcreator || 'ChatGroupCreator';

    conversationselements = [{
      name: createchatgroupname,
      type: types.createchatgroup || 'ClickableElement',
      options: lib.extend({
      }, params.createchatgroup)
    }];
    if (!params.nogroups) {
      conversationselements.push({
        name: chatgroupcreatorname,
        type: types.chatgroupcreator || '', //!TODO: should come up with a default ChatGroupCreator type
        options: lib.extend({
        }, params.chatgroupcreator)
      });
    }
    elements = [{
      name: chatsname,
      type: types.chats || 'ChatConversationsElement',
      options: lib.extend({
        actual: true,
        self_selector: '.',
        default_markup: o(m.div,
          'CLASS', params.ChatsClass || ''
        ),
        elements: conversationselements,
        subDescriptorFromData: function (item) {
          return {
            name: item.id.replace(zeroString, '___'),
            type: types.conversationbrief || 'ChatConversationBriefElement',
            options: lib.extend({
              actual: true,
              self_selector: '.',
              default_markup: o(m.div,
                'CONTENTS', '',
                'CLASS', params.ChatBriefContainerClass
              ),
              //data_markup: '<div><div>profile pic of {{item.resolve}}</div><div>nick of {{item.resolve}}</div><div class="LastMessage"></div></div>',
              data_markup: o(m.div,
                'CONTENTS', [
                  o(m.div,
                    'CLASS', params.ProfilePicClass || '',
                    'CONTENTS', o(m.div,
                      'CLASS', 'profile-pic-container',
                      'CONTENTS', [
                        o(m.div,
                          'CLASS', 'profile-pic-dummy',
                          'CONTENTS', ''
                        ),
                        o(m.div,
                          'CLASS', 'profile-pic-content',
                          'CONTENTS', '{{item.resolve.charAt(0)}}',
                        )
                      ]
                    )
                  ),
                  o(m.div,
                    'CLASS', params.ProfileNickAndLastMessageContainer || '',
                    'CONTENTS', o(m.div,
                    'CONTENTS', [
                      o(m.div,
                        'CLASS', params.ProfileNickClass || '',
                        'CONTENTS', 'Nick of {{item.resolve}}' 
                      ),
                      o(m.div,
                        'CLASS', 'LastMessage' + (params.LastMessageClass ? ' ' + params.LastMessageClass : ''),
                        'CONTENTS', '' 
                      )
                    ])
                  )
                ],
                'CLASS', params.ChatBriefClass || ''
              ),
              elements: [{
                name: 'LastMessage',
                type: types.message || 'ChatMessage',
                options: {
                  actual: true,
                  self_selector: '.',
                  data_markup_options: params.lastmessage,
                  data: item.conv.lastm
                }
              },{
                name: 'UnreadMessages',
                type: 'WebElement',
                options: {
                  actual: false,
                  self_selector: '.',
                  default_markup: o(m.div,
                    'CONTENTS', 'GDE SU UNREAD MESSAGES?'
                  )
                }
              }]
            }, params.conversationbrief)
          }
        }
      }, params.chats),
      links: [/*{
        source: '.'+createchatgroupname+'!clicked',
        target: '.'+chatgroupcreatorname+':actual',
        filter: function () {
          console.log('reklo bi se da je CreateChatGroup kliknut');
          return true;
        }
      }*/{
        source: '.'+createchatgroupname+'!clicked',
        target: '.!needGroupCandidates'
      }]
    },{
      name: historyname,
      type: types.history || 'ChatConversationHistory',
      options: lib.extend({
        //actual: true,
        self_selector: '.',
        default_markup: o(m.div,
          'CLASS', params.ChatHistoryClass || ''
        ),
        elements: [{
          name: 'Header',
          type: types.historyheader || 'ChatConversationHistoryHeaderElement',
          options: lib.extend({
            actual: true,
            self_selector: '.',
            default_markup: '<div><span class="chathistoryheadernick"></span></div>',
            onMasterDataChanged: function (me, data) {
              me.$element.find('.chathistoryheadernick').text(
                lib.isVal(data) ? data.conv.name || data.resolve : ''
              );
            }
          }, params.historyheader)
        },{
          name: 'Messages',
          type: types.messages || 'ChatConversationMessages',
          options: lib.extend({
            actual: true,
            self_selector: '.',
            skip_purge_subelements: true,
            default_markup: o(m.div,
              'CLASS', params.MessagesClass || ''
            ),
            subDescriptorFromData: function (item) {
              return {
                name: 'chatmessage_'+item.id,
                type: 'ChatMessage',
                options: {
                  actual: true,
                  self_selector: '.',
                  default_markup: o(m.div,
                    'CLASS', params.ChatMessageClass || 'ChatMessage'
                  ),
                  contextmenu: {
                    selector: '.mychat',
                    items: {
                      edit: {name: 'Edit', icon: 'edit'}
                    }
                  },
                  data_markup_options: params.messages,
                  data: item
                }
              };
            },
            elements: [{
              name: 'UnreadMessages',
              type: 'WebElement',
              options: {
                self_selector: '.',
                default_markup: o(m.div
                )
              }
            }]
          }, params.messages)
        },{
          name: 'Modes',
          type: 'ChatModesElement',
          options: {
            actual: true,
            self_selector: 'attrib:chatelement'
          }
        },{
          name: 'Send',
          type: 'SendChatMessageFormLogic',
          options: {
            actual: true,
            self_selector: 'attrib:chatelement',
            default_markup: createSendMessageForm(params.sendmessageform),
            validation: {
              message_text: {
                regex: '[\\w,\\W]+'
              }
            }
          }
        }]
      }, params.history),
      links: [{
        source: '.:data',
        target: '.:actual'
      },{
        source: '.Messages!messageSeen',
        target: '.!messageSeen'
      }],
      logic: [{
        triggers: '.Messages!needOlder',
        references: '.',
        handler: function (me, noevnt) {
          me.oldestMessageId = noevnt;
          me.askForMessages();
        }
      }/* obsolete naive logic, now ChatConversationHistoryElement deals with this ,{
        triggers: '.Send!submit',
        references: '.,.Send',
        handler: function (me, form, submitted) {
          var mydata = me.get('data');
          me.send.fire(lib.extend(submitted, {
            togroup: mydata.id,
            to: mydata.resolve
          }));
          form.resetForm();
        }
      }*/]
    }].concat(params.elements || []);

    return {
      actual: params.actual,
      self_selector: '.',
      default_markup: o(m.div,
        'CLASS', params.ChatClass || ''
      ),
      elements: elements
    };
  };
  ChatWidgetModifier.prototype.DEFAULT_CONFIG = function () {
    return {};
  };

  applib.registerModifier('ChatWidget', ChatWidgetModifier);
}

module.exports = createChatWidget;

},{}],13:[function(require,module,exports){
function createChatWidgetIntegrator (lib, applib) {
  'use strict';

  var BasicModifier = applib.BasicModifier;

  function plainUserNameForIder () {
  }

  function doTheNeedGroupCandidates (pp, chatinterfacename, logic, cgh) {
    //var cgh = this.config.chatgrouphandling,
    var pathtochatgroupcreator, groupcandidatesproducer;
    if (!cgh) {
      return;
    }
    cgh.needgroupcandidates = cgh.needgroupcandidates || {};
    pathtochatgroupcreator = cgh.needgroupcandidates.chatgroupcreatorpath || 'Chats.ChatGroupCreator';
    groupcandidatesproducer = cgh.needgroupcandidates.producer;
    if (!lib.isFunction(groupcandidatesproducer)) {
      return;
    }
    logic.push({
      triggers: pp+'.'+chatinterfacename+'!needGroupCandidates',
      references: pp+'.'+chatinterfacename+'.'+pathtochatgroupcreator+','+cgh.needgroupcandidates.references,
      handler: function () {
        var args = Array.prototype.slice.call(arguments),
          chatgroupcreatorel = args[0],
          data;
        //evnt = args[args.length-1];
        data = groupcandidatesproducer.apply(null, args.slice(1, -1));
        data = lib.isArray(data) ? data.slice() : null;
        chatgroupcreatorel.set('data', {candidates: data});
        chatgroupcreatorel.set('actual', !!data);
      }
    });
    logic.push({
      triggers: pp+'.'+chatinterfacename+'!needGroupInfoDisplay',
      references: pp+'.'+chatinterfacename+'.'+pathtochatgroupcreator+','+cgh.needgroupcandidates.references,
      handler: function () {
        var args = Array.prototype.slice.call(arguments),
          chatgroupcreatorel = args[0],
          groupdata = args[args.length-1],
          data;
        //evnt = args[args.length-1];
        data = groupcandidatesproducer.apply(null, args.slice(1, -1));
        data = lib.isArray(data) ? data.slice() : null;
        //console.log('needGroupInfoDisplay for group', groupdata);
        chatgroupcreatorel.set('data', {group: groupdata, candidates: data});
        chatgroupcreatorel.set('actual', !!data);
      }
    });
  }

  function doTheFullDataHandling (pp, chatinterfacename, logic, fdh) {
    var producer = fdh.id2fulldata;
    logic.push({
      triggers: pp+'.'+chatinterfacename+'!needFullDataForId',
      references: pp+'.'+chatinterfacename+','+fdh.references,
      handler: function () {
        var itf = arguments[0],
          args = Array.prototype.slice.call(arguments, 1, -1),
          queryobj = arguments[arguments.length-1],
          prodres = producer.apply(null, args.concat(queryobj.id));
        itf.fullDataForId({
          callback: queryobj.callback,
          fulldata: prodres
        });
      }
    });
  }

  function ChatWidgetIntegratorModifier (options) {
    if (!('chatwidgetparentpath' in options)) {
      throw new Error('options for '+this.constructor.name+' must have a "chatwidgetparentpath" property');
    }
    BasicModifier.call(this, options);
  }
  lib.inherit(ChatWidgetIntegratorModifier, BasicModifier);

  ChatWidgetIntegratorModifier.prototype.doProcess = function(name, options, links, logic, resources){
    var rlm = this.config.chatrealm,
      pp = this.config.chatwidgetparentpath,
      chatinterfacename = this.config.interfacename || 'Chat';

    if (!rlm) {
      throw new Error('ChatWidgetIntegrator must have a "chatrealm" name in its config');
    }
    rlm = 'On'+rlm;

    logic.push({
      triggers: pp+'.'+chatinterfacename+'!needInitiations',
      references: '.>initiateChatConversationsWithUsers'+rlm,
      handler: function (iccwufunc, userids) {
        //console.log('needInitiations', userids);
        iccwufunc([userids]);
      }
    },{
      triggers: '.>initiateChatConversationsWithUsers'+rlm,
      references: pp+','+pp+'.'+chatinterfacename,
      handler: function (me, itf, icc) {
        /*
        if (!me.get('actual')) {
          return;
        }
        */
        if (icc.running) {
          return;
        }
        //console.log('got initiations', icc.result);
        itf.set('data', icc.result);
      }
    },{
      triggers: 'datasource.chatnotification'+rlm+':data',
      references: pp+','+pp+'.'+chatinterfacename,
      handler: function(me, itf, chatntf){
        /*
        if (!me.get('actual')) {
          return;
        }
        */
        itf.set('lastnotification', chatntf);
      }
    },{
      triggers: pp+'.'+chatinterfacename+'!needMessages',
      references: '.>getChatMessages'+rlm,
      handler: function (getChatMessages, need) {
        console.log('needMessages', need);
        getChatMessages([need.id, need.oldest, lib.isNumber(need.howmany) ? need.howmany : 20]);
      }
    },{
      triggers: pp+'.'+chatinterfacename+'!messageToSend',
      references: '.>sendChatMessage'+rlm,
      handler: function(sendChatMessage, evnt){
        sendChatMessage([evnt.togroup, evnt.to, evnt.message_text, evnt.options]);
      }
    },{
      triggers: pp+'.'+chatinterfacename+'!messageToEdit',
      references: '.>editChatMessage'+rlm,
      handler: function(editChatMessage, evnt){
        console.log('editChatMessage', evnt);
        editChatMessage([evnt.convid, evnt.id, evnt.message_text, evnt.options]);
      }
    },{
      triggers: pp+'.'+chatinterfacename+'!active',
      references: '.>reportChatActivity'+rlm,
      handler: function(reportChatActivity, evnt){
        console.log('reportChatActivity', evnt);
        reportChatActivity([evnt.convid]);
      }
    },{
      triggers: pp+'.'+chatinterfacename+'!messageSeen',
      references: '.>markMessageSeen'+rlm,
      handler: function (markMessageSeen, need) {
        markMessageSeen([need.convid, need.msgid]);
      }
    },{
      triggers: '.>getChatMessages'+rlm,
      references: pp+','+pp+'.'+chatinterfacename,
      handler: function (me, itf, gcm) {
        if (!me.get('actual')) {
          return;
        }
        if (gcm.running) {
          return;
        }
        itf.set('chatmessages', gcm.result);
      }
    },{
      triggers: pp+'.'+chatinterfacename+'!needUserNameForId',
      references: pp+'.'+chatinterfacename,
      handler: function (itf, queryobj) {
        queryobj.username = queryobj.userid;
        itf.userNameForId(queryobj);
      }
    });
    //handle the needUserNameForId
    /*
    logic.push({
    });
    */
    //handle the needGroupCandidates
    if (this.config.chatgrouphandling) {
      doTheNeedGroupCandidates(pp, chatinterfacename, logic, this.config.chatgrouphandling);
    }
    //endof needGroupCandidates
    if (this.config.fulldatahandling) {
      doTheFullDataHandling(pp, chatinterfacename, logic, this.config.fulldatahandling);
    }
    //handle createNewChatGroupWithMembers
    if (this.config.createnewchatgroupwithmemberstrigger) {
      logic.push({
        triggers: this.config.createnewchatgroupwithmemberstrigger,
        references: '.>createNewChatGroupWithMembers'+rlm,
        handler: function (cncgwmfunc, evnt) {
          console.log(evnt);
          cncgwmfunc([evnt.name, evnt.members]);
        }
      });
    }
    //endof handle createNewChatGroupWithMembers
    if (!this.config.skipconversationloading) {
      logic.push({
        triggers: pp+':actual,'+pp+'.'+chatinterfacename+':initialized',
        references: '.>getChatConversations'+rlm,
        handler: function(gcc, myactual, initialized){
          console.log('Chatinitialized', initialized);
          if (myactual && initialized) {
            console.log('off to getChatConversations');
            gcc([]);
          }
        }
      },{
        triggers: '.>getChatConversations'+rlm,
        references: pp+','+pp+'.'+chatinterfacename,
        handler: function (me, itf, gcc) {
          if (!me.get('actual')) {
            return;
          }
          if (gcc.running) {
            return;
          }
          itf.set('data', gcc.result);
        }
      });
    }
  };
  ChatWidgetIntegratorModifier.prototype.DEFAULT_CONFIG = function () {
    return {};
  };

  applib.registerModifier('ChatWidgetIntegrator', ChatWidgetIntegratorModifier);
}
module.exports = createChatWidgetIntegrator;


},{}],14:[function(require,module,exports){
function createModifiers (lib, applib, templateslib, htmltemplateslib, utils) {
  'use strict';

  require('./chatwidgetcreator')(lib, applib, templateslib, htmltemplateslib, utils);
  require('./chatwidgetintegratorcreator')(lib, applib, templateslib, htmltemplateslib, utils);
}

module.exports = createModifiers;

},{"./chatwidgetcreator":12,"./chatwidgetintegratorcreator":13}],15:[function(require,module,exports){
function createPrePreprocessors (lib, applib) {
  'use strict';

  require('./initcreator')(lib, applib);
}
module.exports = createPrePreprocessors;

},{"./initcreator":16}],16:[function(require,module,exports){
function createInitChatPrePreprocessor (lib, applib) {
  'use strict';

  var BasicProcessor = applib.BasicProcessor;

  function InitChatPrePreprocessor () {
    BasicProcessor.call(this);
  }
  lib.inherit(InitChatPrePreprocessor, BasicProcessor);
  function commander (envname, rlm, fnname) {
    //console.log(fnname+'On'+rlm);
    return {
      environment: envname,
      entity: {
        name: fnname+'On'+rlm,
        options: {
          sink: '.',
          name: fnname+'On'+rlm
        }
      }
    };
  }
  function allexstatedser (envname, rlm, dsname) {
    //console.log(dsname+'On'+rlm);
    return {
      environment: envname,
      entity: {
        name: dsname+'On'+rlm,
        type: 'allexstate',
        options: {
          sink: '.',
          path: dsname+'On'+rlm
        }
      }
    };
  }
  InitChatPrePreprocessor.prototype.process = function (desc) {
    var env = this.config.environment,
      rlm = this.config.chatrealm;
    desc.preprocessors = desc.preprocessors || {};
    desc.preprocessors.Command = desc.preprocessors.Command || [];
    desc.preprocessors.DataSource = desc.preprocessors.DataSource || [];

    desc.preprocessors.Command.push.apply(desc.preprocessors.Command, [
      'getChatMessages',
      'initiateChatConversationsWithUsers',
      'getChatConversations',
      'sendChatMessage',
      'markMessageRcvd',
      'markMessageSeen',
      'editChatMessage',
      'reportChatActivity',
      'createNewChatGroupWithMembers'
    ].map(commander.bind(null, env, rlm)));
    desc.preprocessors.DataSource.push.apply(desc.preprocessors.DataSource, [
      'chatnotification',
    ].map(allexstatedser.bind(null, env, rlm)));


    env = null;
    rlm = null;
  };

  InitChatPrePreprocessor.prototype.neededConfigurationNames = ['environment', 'chatrealm'];

  applib.registerPrePreprocessor('ChatInit', InitChatPrePreprocessor);
}
module.exports = createInitChatPrePreprocessor;

},{}],17:[function(require,module,exports){
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

},{}]},{},[11]);
