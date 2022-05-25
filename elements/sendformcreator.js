function createSendForm (lib, applib, jquerylib, templateslib, htmltemplateslib, bufftriglib, utils) {
  'use strict';

  var FormLogic = applib.getElementType('FormElement'), // applib.getElementType('FormLogic'),
    BufferedTrigger = bufftriglib.BufferedTrigger;

  function SendChatMessageFormLogic (id, options) {
    options = options || {};
    options.elements = options.elements || [];
    options.elements.push({
      name: 'message_text',
      type: 'PlainHashFieldElement',
      options: {
        actual: true,
        self_selector: 'attrib:name',
        hashfield: 'message_text',
        fieldname: 'message_text'
      }
    },{
      name: 'SendSubmit',
      type: 'ClickableElement',
      options: {
        actual: true,
        self_selector: '.'
      }
    });
    FormLogic.call(this, id, options);
    this.trigger = new BufferedTrigger(this.fireActive.bind(this), options.input_timeout||5000);
    this.active = this.createBufferableHookCollection();
    this.focuser = this.onMessageBoxFocused.bind(this);
    this.blurrer = this.onMessageBoxBlurred.bind(this);
    this.clicker = this.onButtonClicked.bind(this);
  }
  lib.inherit(SendChatMessageFormLogic, FormLogic);
  SendChatMessageFormLogic.prototype.__cleanUp = function () {
    this.buttonElementOperation('off', 'blur', this.clicker);
    this.messageBoxElementOperation('off', 'blur', this.blurrer);
    this.messageBoxElementOperation('off', 'focus', this.focuser);
    this.clicker = null;
    this.blurrer = null;
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
  SendChatMessageFormLogic.prototype.staticEnvironmentDescriptor = function (myname) {
    return {
      links: [{
        source: 'element.'+myname+':valid',
        target: 'element.'+myname+'.SendSubmit:enabled'
      },{
        source: 'element.'+myname+'.SendSubmit!clicked',
        target: 'element.'+myname+'>fireSubmit',
        filter: function (thingy) {
          return thingy;
        }
      }]
    };
  };
  SendChatMessageFormLogic.prototype.resetForm = function () {
    if (this.trigger) {
      this.trigger.clearTimeout();
    }
    FormLogic.prototype.resetData.call(this);
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
    this.buttonElementOperation('on', 'click', this.clicker);
  };
  SendChatMessageFormLogic.prototype.buttonElementOperation = function () {
    var bel;
    if (!this.$element) {
      return null;
    }
    bel = this.$element.find('button');
    if (!(bel && bel.length>0)) {
      return null;
    }
    return bel[arguments[0]].apply(bel, Array.prototype.slice.call(arguments, 1));
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
  SendChatMessageFormLogic.prototype.onButtonClicked = function () {
    this.messageBoxElementOperation('focus');
  };
  SendChatMessageFormLogic.prototype.focusInABit = function () {
    console.log('focusInABit');
    lib.runNext(this.messageBoxElementOperation.bind(this, 'focus'), 20);
  };

  SendChatMessageFormLogic.prototype.postInitializationMethodNames = SendChatMessageFormLogic.prototype.postInitializationMethodNames.concat(['initSendChatMessageFormLogic']);

  applib.registerElementType('SendChatMessageFormLogic', SendChatMessageFormLogic);
}
module.exports = createSendForm;
