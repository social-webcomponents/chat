function createSendForm (lib, applib, jquerylib, templateslib, htmltemplateslib, bufftriglib, utils) {
  'use strict';

  var FormLogic = applib.getElementType('FormLogic'),
    BufferedTrigger = bufftriglib.BufferedTrigger;

  function SendChatMessageFormLogic (id, options) {
    FormLogic.call(this, id, options);
    this.trigger = new BufferedTrigger(this.fireActive.bind(this), options.input_timeout||5000);
    this.active = this.createBufferableHookCollection();
    this.focuser = this.onMessageBoxFocused.bind(this);
    this.blurrer = this.onMessageBoxBlurred.bind(this);
  }
  lib.inherit(SendChatMessageFormLogic, FormLogic);
  SendChatMessageFormLogic.prototype.__cleanUp = function () {
    this.messageBoxElementOperation('off', 'blur', this.blurrer);
    this.messageBoxElementOperation('off', 'focus', this.focuser);
    this.focuser = null;
    if (this.active) {
      this.active.destroy();
    }
    this.active = null;
    if (this.trigger) {
      this.messageBoxElementOperation('off', 'keyup', this.trigger.triggerer);
      this.trigger.destroy();
    }
    this.trigger = null;
    FormLogic.prototype.__cleanUp.call(this);
  };
  SendChatMessageFormLogic.prototype.resetForm = function () {
    if (this.trigger) {
      this.trigger.clearTimeout();
    }
    FormLogic.prototype.resetForm.call(this);
  };
  SendChatMessageFormLogic.prototype.set_contents = function (val) {
    if (!this.$element) {
      return null;
    }
    this.$element.find('[name="message_text"]').val(val);
    return true;
  };
  SendChatMessageFormLogic.prototype.get_contents = function () {
    if (!this.$element) {
      return null;
    }
    return this.$element.find('[name="message_text"]').val();
  };
  SendChatMessageFormLogic.prototype.focus = function () {
    this.messageBoxElementOperation('focus');
  };
  SendChatMessageFormLogic.prototype.initSendChatMessageFormLogic = function () {
    if (this.trigger) {
      //this.$element.find('[name="message_text"]').on('keyup', this.trigger.triggerer);
      this.messageBoxElementOperation('on', 'keyup', this.trigger.triggerer);
    }
    this.messageBoxElementOperation('on', 'focus', this.focuser);
    this.messageBoxElementOperation('on', 'blur', this.blurrer);
  };
  SendChatMessageFormLogic.prototype.messageBoxElementOperation = function () {
    var mbel;
    if (!this.$element) {
      return null;
    }
    mbel = this.$element.find('[name="message_text"]');
    if (!(mbel && mbel.length>0)) {
      return null;
    }
    return mbel[arguments[0]].apply(mbel, Array.prototype.slice.call(arguments, 1));
  };
  SendChatMessageFormLogic.prototype.fireActive = function () {
    console.log('typing!');
    if (this.active) {
      this.active.fire(true);
    }
  };
  SendChatMessageFormLogic.prototype.onMessageBoxFocused = function () {
    if (!this.get('actual')) {
      return;
    }
    if (!this.__parent) {
      return;
    }
    this.__parent.onMessageBoxFocused();
  };
  SendChatMessageFormLogic.prototype.onMessageBoxBlurred = function () {
    if (!this.get('actual')) {
      return;
    }
    if (!this.__parent) {
      return;
    }
    this.__parent.onMessageBoxBlurred();
  };

  SendChatMessageFormLogic.prototype.postInitializationMethodNames = SendChatMessageFormLogic.prototype.postInitializationMethodNames.concat(['initSendChatMessageFormLogic']);

  applib.registerElementType('SendChatMessageFormLogic', SendChatMessageFormLogic);
}
module.exports = createSendForm;
