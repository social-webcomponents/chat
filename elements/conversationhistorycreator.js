function createChatConversationHistory (lib, applib, templateslib, htmltemplateslib, utils) {
  'use strict';

  var DataAwareElement = applib.getElementType('DataAwareElement'),
    DataElementFollowerMixin = applib.mixins.DataElementFollowerMixin;

  function ChatConversationHistoryElement (id, options) {
    DataAwareElement.call(this, id, options);
    DataElementFollowerMixin.call(this);
    this.needMessages = this.createBufferableHookCollection();
    this.messageSeen = this.createBufferableHookCollection();
    this.conversationChanged = this.createBufferableHookCollection();
    this.send = new lib.HookCollection();
    this.chatId = null;
    this.oldestMessageId = null;
  }
  lib.inherit(ChatConversationHistoryElement, DataAwareElement);
  DataElementFollowerMixin.addMethods(ChatConversationHistoryElement);
  ChatConversationHistoryElement.prototype.__cleanUp = function () {
    this.oldestMessageId = null;
    this.chatId = null;
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
    DataElementFollowerMixin.prototype.destroy.call(this);
    DataAwareElement.prototype.__cleanUp.call(this);
  };
  ChatConversationHistoryElement.prototype.onMasterDataChanged = function (data) {
    if (!lib.isVal(data)) {
      this.chatId = null;
      this.set('data', null);
      this.conversationChanged.fire(null);
      return;
    }
    if (data.id !== this.chatId && data.chatId !== this.chatId) {
      this.chatId = data.chatId || data.id;
      this.conversationChanged.fire(this.chatId);
      this.askForMessages();
    }
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

  applib.registerElementType('ChatConversationHistory', ChatConversationHistoryElement);
}

module.exports = createChatConversationHistory;
