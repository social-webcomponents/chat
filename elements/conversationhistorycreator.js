function createChatConversationHistory (lib, applib, templateslib, htmltemplateslib, utils) {
  'use strict';

  var DataAwareElement = applib.getElementType('DataAwareElement'),
    DataElementFollowerMixin = applib.mixins.DataElementFollowerMixin;

  function ChatConversationHistoryElement (id, options) {
    DataAwareElement.call(this, id, options);
    DataElementFollowerMixin.call(this);
    this.needMessages = new lib.HookCollection();
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
    if (this.needMessages) {
      this.needMessages.destroy();
    }
    this.needMessages = null;
    DataElementFollowerMixin.prototype.destroy.call(this);
    DataAwareElement.prototype.__cleanUp.call(this);
  };
  ChatConversationHistoryElement.prototype.onMasterDataChanged = function (data) {
    console.log('oli onMasterDataChanged?', data);
    if (data.id !== this.chatId) {
      this.chatId = data.id;
      this.askForMessages();
    }
    this.set('data', data);
  };
  ChatConversationHistoryElement.prototype.askForMessages = function () {
    this.needMessages.fire({id: this.chatId, oldest: this.oldestMessageId, howmany: this.getConfigVal('pagesize')});
  };

  applib.registerElementType('ChatConversationHistory', ChatConversationHistoryElement);
}

module.exports = createChatConversationHistory;
