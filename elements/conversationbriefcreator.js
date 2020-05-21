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
