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
