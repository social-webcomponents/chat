function createChatConversationMessages (lib, applib, jquerylib, templateslib, htmltemplateslib, chatweblib, utils) {
  'use strict';

  var FromDataCreator = applib.getElementType('FromDataCreator'),
    ScrollableMixin = jquerylib.mixins.Scrollable,
    HeartbeatHandlerMixin = chatweblib.mixins.HeartbeatHandler;

  function ChatConversationMessagesElement (id, options) {
    FromDataCreator.call(this, id, options);
    ScrollableMixin.call(this);
    HeartbeatHandlerMixin.call(this);
    this.needOlder = this.createBufferableHookCollection();
    this.messageSeen = this.createBufferableHookCollection();
    this.reportMessageSeen = new lib.DIContainer();
    this.oldestId = null;
    this.noOlder = null;
  }
  lib.inherit(ChatConversationMessagesElement, FromDataCreator);
  ScrollableMixin.addMethods(ChatConversationMessagesElement);
  HeartbeatHandlerMixin.addMethods(ChatConversationMessagesElement);
  ChatConversationMessagesElement.prototype.__cleanUp = function () {
    this.noOlder = null;
    this.oldestId = null;
    if (this.reportMessageSeen) {
      this.reportMessageSeen.destroy();
    }
    this.reportMessageSeen = null;
    if (this.messageSeen) {
      this.messageSeen.destroy();
    }
    this.messageSeen = null;
    if (this.needOlder) {
      this.needOlder.destroy();
    }
    this.needOlder = null;
    HeartbeatHandlerMixin.prototype.destroy.call(this);
    ScrollableMixin.prototype.destroy.call(this);
    FromDataCreator.prototype.__cleanUp.call(this);
  };
  ChatConversationMessagesElement.prototype.set_data = function (data) {
    var datavalid = lib.isArray(data) && data.length>0,
      ret;
    if (!datavalid) {
      this.oldestId = null;
      this.noOlder = null;
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
      console.log('scrollElementToBottom!');
      this.scrollElementToBottom();
      return ret;
    }
    return ret;
  };
  ChatConversationMessagesElement.prototype.createFromArryItem = function (item) {
    if (item.oldest) {
      this.noOlder = true;
    }
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
    if (!this.noOlder) {
      this.needOlder.fire(this.oldestId);
    }
  };

  ChatConversationMessagesElement.prototype.checkMessagesSeenability = function () {
    if (!(lib.isArray(this.subElements) && this.subElements.length>0)) {
      return;
    }
    this.subElements.forEach(this.checkSingleMessageSeenability.bind(this));
  };

  ChatConversationMessagesElement.prototype.checkSingleMessageSeenability = function (chld) {
    var cd;
    cd = chld.get('data');
    if (!(chld && chld.$element)) {
      return;
    }
    if (chld.containedMessageSeenByMe()) {
      return;
    }
    if (this.elementIsWithinTheScrollableArea(chld.$element)) {
      this._doTheMessageSeenReporting(cd);
    }
  };

  ChatConversationMessagesElement.prototype._doTheMessageSeenReporting = function (msg) {
    var mymsgseen = {
      messageid: msg.id,
      seenby: null,
      seenat: Date.now()
    },
    mymsgrcvd = {
      messageid: msg.id,
      rcvdby: null,
      rcvdat: Date.now()
    };
    this.doSeenMessage(mymsgseen);
    this.doRcvdMessage(mymsgrcvd);
    this.messageSeen.fire(msg.id);
  };

  ChatConversationMessagesElement.prototype.doRcvdMessage = function (rcvdm) {
    this.findElementAndApply(rcvdm, 'messageid', 'updateFromRcvd');
  };
  ChatConversationMessagesElement.prototype.doSeenMessage = function (seenm) {
    this.findElementAndApply(seenm, 'messageid', 'updateFromSeen');
  };
  ChatConversationMessagesElement.prototype.doEditMessage = function (editedm) {
    this.findElementAndApply(editedm, 'id', 'updateFromEdit');
  };
  ChatConversationMessagesElement.prototype.findElementAndApply = function (msg, propname4find, methodname) {
    var affectedwi = lib.arryOperations.findElementAndIndexWithProperty(this.subElements, 'id', 'chatmessage_'+msg[propname4find]);
    if (!(affectedwi && affectedwi.element)) {
      return;
    }
    affectedwi.element[methodname](msg);
  };

  ChatConversationMessagesElement.prototype.doPreviewMessage = function (preview) {
    var affectedwi = lib.arryOperations.findElementAndIndexWithProperty(this.subElements, 'id', 'chatmessage_'+preview.id);
    if (!(affectedwi && affectedwi.element)) {
      return;
    }
    affectedwi.element.updatePreview(preview);
  };

  applib.registerElementType('ChatConversationMessages', ChatConversationMessagesElement);
}

module.exports = createChatConversationMessages;
