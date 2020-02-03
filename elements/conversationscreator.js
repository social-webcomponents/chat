function createChatConversationsElement (lib, applib, templateslib, htmltemplateslib, utils) {
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

  var FromDataCreator = applib.getElementType('FromDataCreator');

  function ChatConversationsElement (id, options) {
    FromDataCreator.call(this, id, options);
    this.selected = new lib.HookCollection();
    this.selectedItemId = null;
  }
  lib.inherit(ChatConversationsElement, FromDataCreator);
  ChatConversationsElement.prototype.__cleanUp = function () {
    if (this.selected) {
      this.selected.destroy();
    }
    this.selected = null;
    FromDataCreator.prototype.__cleanUp.call(this);
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


  applib.registerElementType('ChatConversations', ChatConversationsElement);
}

module.exports = createChatConversationsElement;
