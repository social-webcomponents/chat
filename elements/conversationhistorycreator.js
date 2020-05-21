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
  ChatConversationHistoryElement.prototype.initChatConversationHistory = function () {
    var sendform;
    try {
      sendform = this.getElement('Send');
    } catch (e) {
      return;
    }
    this.childrenListeners.push(sendform.attachListener('submit', this.onSendSubmit.bind(this)));
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
      this.p2p = data.conv.p2p;
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
    this.__parent.detachActiveChat();
    this.set('data', null);
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

  ChatConversationHistoryElement.prototype.postInitializationMethodNames = ChatConversationHistoryElement.prototype.postInitializationMethodNames.concat(['initChatConversationHistory']);
  applib.registerElementType('ChatConversationHistory', ChatConversationHistoryElement);
}

module.exports = createChatConversationHistory;
