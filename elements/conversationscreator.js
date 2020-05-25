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

  applib.registerElementType('ChatConversationsElement', ChatConversationsElement);
}

module.exports = createChatConversationsElement;
