function createSendForm (lib, applib, jquerylib, templateslib, htmltemplateslib, bufftriglib, utils) {
  'use strict';

  var FormLogic = applib.getElementType('FormLogic'),
    BufferedTrigger = bufftriglib.BufferedTrigger;

  function SendChatMessageFormLogic (id, options) {
    FormLogic.call(this, id, options);
    this.trigger = new BufferedTrigger(this.fireActive.bind(this), options.input_timeout||5000);
    this.active = this.createBufferableHookCollection();
  }
  lib.inherit(SendChatMessageFormLogic, FormLogic);
  SendChatMessageFormLogic.prototype.__cleanUp = function () {
    if (this.active) {
      this.active.destroy();
    }
    this.active = null;
    if (this.trigger) {
      this.$element.find('[name="message_text"]').off('keyup', this.trigger.triggerer);
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
    if (!this.$element) {
      return;
    }
    this.$element.find('[name="message_text"]').focus();
  };
  SendChatMessageFormLogic.prototype.initSendChatMessageFormLogic = function () {
    if (this.trigger) {
      this.$element.find('[name="message_text"]').on('keyup', this.trigger.triggerer);
    }
  };
  SendChatMessageFormLogic.prototype.fireActive = function () {
    console.log('typing!');
    if (this.active) {
      this.active.fire(true);
    }
  };

  SendChatMessageFormLogic.prototype.postInitializationMethodNames = SendChatMessageFormLogic.prototype.postInitializationMethodNames.concat(['initSendChatMessageFormLogic']);

  applib.registerElementType('SendChatMessageFormLogic', SendChatMessageFormLogic);
}
module.exports = createSendForm;
