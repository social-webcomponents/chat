function createChatConversationMessages (lib, applib, jquerylib, templateslib, htmltemplateslib, utils) {
  'use strict';

  var FromDataCreator = applib.getElementType('FromDataCreator'),
    ScrollableMixin = jquerylib.mixins.Scrollable;

  function ChatConversationMessagesElement (id, options) {
    FromDataCreator.call(this, id, options);
    ScrollableMixin.call(this);
    this.oldestId = null;
    this.needOlder = this.createBufferableHookCollection();
    this.messageSeen = this.createBufferableHookCollection();
  }
  lib.inherit(ChatConversationMessagesElement, FromDataCreator);
  ScrollableMixin.addMethods(ChatConversationMessagesElement);
  ChatConversationMessagesElement.prototype.__cleanUp = function () {
    if (this.messageSeen) {
      this.messageSeen.destroy();
    }
    this.messageSeen = null;
    if (this.needOlder) {
      this.needOlder.destroy();
    }
    this.needOlder = null;
    this.oldestId = null;
    ScrollableMixin.prototype.destroy.call(this);
    FromDataCreator.prototype.__cleanUp.call(this);
  };
  ChatConversationMessagesElement.prototype.set_data = function (data) {
    var datavalid = lib.isArray(data) && data.length>0,
      ret;
    if (!datavalid) {
      this.oldestId = null;
    }
    ret = FromDataCreator.prototype.set_data.call(this, data);
    this.checkMessagesSeenability();
    return ret;
  };
  ChatConversationMessagesElement.prototype.createFromArryData = function (data) {
    var initsubelcount = lib.isArray(this.subElements) ? this.subElements.length : 0,
      finalsubelcount,
      initoldest = this.oldestId,
      finaloldest,
      wasatbottom = this.elementIsScrolledToBottom(),
      ret;
    ret = FromDataCreator.prototype.createFromArryData.call(this, data);
    finalsubelcount = lib.isArray(this.subElements) ? this.subElements.length : 0;
    finaloldest = this.oldestId;
    if (initsubelcount === finalsubelcount) {
      return;
    }
    //if (initsubelcount === 0 || (initoldest !== finaloldest)) {
    if (initsubelcount===0 || wasatbottom) {
      this.scrollElementToBottom();
      return ret;
    }
    return ret;
  };
  ChatConversationMessagesElement.prototype.createFromArryItem = function (item) {
    this.assignOldestId(item.id);
    return FromDataCreator.prototype.createFromArryItem.call(this, item);
  };
  ChatConversationMessagesElement.prototype.assignOldestId = function (id) {
    if (!lib.isNumber(this.oldestId)) {
      this.oldestId = id;
      return;
    }
    if (this.oldestId>id) {
      this.oldestId = id;
    }
  };
  ChatConversationMessagesElement.prototype.onElementScrolled = function () {
    this.checkMessagesSeenability();
    ScrollableMixin.prototype.onElementScrolled.apply(this, arguments);
  };
  ChatConversationMessagesElement.prototype.onElementScrolledToTop = function () {
    this.needOlder.fire(this.oldestId);
  };

  ChatConversationMessagesElement.prototype.checkMessagesSeenability = function () {
    if (!(lib.isArray(this.subElements) && this.subElements.length>0)) {
      return;
    }
    this.subElements.forEach(this.checkSingleMessageSeenability.bind(this));
  };

  ChatConversationMessagesElement.prototype.checkSingleMessageSeenability = function (chld) {
    var cd;
    if (!(chld && chld.$element)) {
      return;
    }
    //console.log('checkMessagesSeenability', chld.id, chld.get('data'));
    cd = chld.get('data');
    if (!cd) {
      return;
    }
    if (cd.from === null) {
      return;
    }
    if (cd.seen) {
      return;
    }
    if (this.elementIsWithinTheScrollableArea(chld.$element)) {
      this.messageSeen.fire(cd.id);
    }
  };

  applib.registerElementType('ChatConversationMessages', ChatConversationMessagesElement);
}

module.exports = createChatConversationMessages;
