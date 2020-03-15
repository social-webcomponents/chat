function createChatMessageElement (lib, applib, templateslib, htmltemplateslib, chatweblib, utils) {
  'use strict';

  var DataAwareElement = applib.getElementType('DataAwareElement'),
    o = templateslib.override,
    m = htmltemplateslib;

  function optionsvalue (options, name, dflt) {
    var p, ret;
    if (!options) {
      return dflt;
    }
    ret = lib.readPropertyFromDotDelimitedString(options, name);
    return lib.isVal(ret) ? ret : dflt;
  }
  function createDataMarkup (options) {
    var mychatclass = optionsvalue(options, 'class.mychat', 'mychat'),
      otherschatclass = optionsvalue(options, 'class.otherschat', 'otherschat'),
      senderclass = optionsvalue(options, 'class.sender', 'chatsender'),
      chatmessageclass = optionsvalue(options, 'class.chatmessage', 'chatmessage'),
      messageagoclass = optionsvalue(options, 'class.messageago', 'messageago'),
      retContent;

    retContent = [o(m.span,
      'CLASS', chatmessageclass,
      'CONTENTS', '{{item.message}}' 
    ),o(m.span,
      'CLASS', messageagoclass,
      'CONTENTS', '{{item.created_humanreadable}}'
    )];
    if (options && !options.skipSenderName){
      retContent.unshift(o(m.div,
        'CLASS', senderclass,
        'ATTRS', 'style="display:{{!!item.from ? \"block\" : \"none\"}}"',
        'CONTENTS', '{{item.from}}'
      ));
    }

    return o(m.div,
      'CLASS', '{{item.from===null ? "'+mychatclass+'" : "'+otherschatclass+'"}}',
      'CONTENTS', retContent 
    );

  }

  function ChatMessageElement (id, options) {
    options.data_markup = options.data_markup || createDataMarkup(options.data_markup_options);
    DataAwareElement.call(this, id, options);
  }
  lib.inherit(ChatMessageElement, DataAwareElement);
  ChatMessageElement.prototype.set_data = function (item) {
    item.message = chatweblib.processMessage(item.message);
    this.updateHumanReadableCreated(item);
    return DataAwareElement.prototype.set_data.call(this, item);
  };
  ChatMessageElement.prototype.updateHumanReadableCreated = function (d) {
    var d, had_d;
    if (!this.destroyed) {
      return;
    }
    had_d = arguments.length===1;
    d = d || this.get('data');
    if (!(d && d.created)) {
      return;
    }
    if (!had_d) {
      this.updateHashField('created_humanreadable', ago(d.created));
      return;
    }
    d.created_humanreadable = ago(d.created);
    lib.runNext(this.updateHumanReadableCreated.bind(this), nexttickinterval(d.created));
  };

  function ago (time) {
    var now = Date.now(),
      diff = now-time,
      prefix = (diff>0) ? '' : 'in the future'
      ;
    if (diff<0) {
      diff *= -1;
    }
    return rounded(diff)+' '+prefix;
  }

  function rounded (diff) {
    var is = lib.intervals, Day = 24*is.Hour, unit, ret;
    if (diff>Day) {
      ret = diff/Day;
      unit = 'd';
    }
    else if (diff>is.Hour) {
      ret = diff/is.Hour;
      unit = 'h';
    }
    else if (diff>is.Minute) {
      ret = diff/is.Minute;
      unit = 'm';
    }
    else if (diff>is.Second) {
      ret = diff/is.Second;
      unit = 's';
    }
    else {
      return 'Just now';
    }
    return Math.round(ret)+' '+unit+' '+'ago';
  }

  function nexttickinterval (time) {
    var now = Date.now(),
      diff = now-time,
      ret = Math.round(diff/3/1000)*1000;
    if (diff<lib.intervals.Second) {
      diff = lib.intervals.Second;
    }
    return ret;
  }


  applib.registerElementType('ChatMessage', ChatMessageElement);
}

module.exports = createChatMessageElement;
