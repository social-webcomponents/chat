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
    this.selected = this.createBufferableHookCollection();
    this.needGroupCandidates = this.createBufferableHookCollection();
    this.selectedItemId = null;
  }
  lib.inherit(ChatConversationsElement, FromDataCreator);
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


  applib.registerElementType('ChatConversationsElement', ChatConversationsElement);
}

module.exports = createChatConversationsElement;
