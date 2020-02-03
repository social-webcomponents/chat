function createChatConversationBrief (lib, applib, templateslib, htmltemplateslib, utils) {
  'use strict';

  var DataAwareElement = applib.getElementType('DataAwareElement'),
    o = templateslib.override,
    p = templateslib.process,
    m = htmltemplateslib;


  function ChatConversationBriefElement (id, options) {
    DataAwareElement.call(this, id, options);
    this.selected = new lib.HookCollection();
  }
  lib.inherit(ChatConversationBriefElement, DataAwareElement);
  ChatConversationBriefElement.prototype.__cleanUp = function () {
    if (this.$element) {
      this.$element.off('click');
    }
    if (this.selected) {
      this.selected.destroy();
    }
    this.selected = null;
    DataAwareElement.prototype.__cleanUp.call(this);
  };
  ChatConversationBriefElement.prototype.fireInitializationDone = function () {
    if (this.$element) {
      this.$element.on('click', this.onElementClicked.bind(this));
    }
    return DataAwareElement.prototype.fireInitializationDone.call(this);
  };
  ChatConversationBriefElement.prototype.onElementClicked = function () {
    this.selected.fire(this);
  };


  applib.registerElementType('ChatConversationBrief', ChatConversationBriefElement);

}

module.exports = createChatConversationBrief;
