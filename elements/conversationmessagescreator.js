function createChatConversationMessages (lib, applib, templateslib, htmltemplateslib, utils) {
  'use strict';

  var FromDataCreator = applib.getElementType('FromDataCreator'),
    DataElementFollowerMixin = applib.mixins.DataElementFollowerMixin;

  function ChatConversationMessagesElement (id, options) {
    FromDataCreator.call(this, id, options);
    DataElementFollowerMixin.call(this);
  }
  lib.inherit(ChatConversationMessagesElement, FromDataCreator);
  DataElementFollowerMixin.addMethods(ChatConversationMessagesElement);
  ChatConversationMessagesElement.prototype.__cleanUp = function () {
    DataElementFollowerMixin.prototype.destroy.call(this);
    FromDataCreator.prototype.__cleanUp.call(this);
  };
  ChatConversationMessagesElement.prototype.onMasterDataChanged = function (data) {
    this.set('data', lib.isVal(data) ? data.messages : null);
  };

  ChatConversationMessagesElement.prototype.postInitializationMethodNames = FromDataCreator.prototype.postInitializationMethodNames.concat('startListeningToParentData');


  applib.registerElementType('ChatConversationMessages', ChatConversationMessagesElement);
}

module.exports = createChatConversationMessages;
