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
