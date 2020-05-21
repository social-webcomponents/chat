function createChatMessageElement (lib, applib, templateslib, htmltemplateslib, chatweblib, messageparsinglib, jquerycontextmenulib, utils) {
  'use strict';

  var DataAwareElement = applib.getElementType('DataAwareElement'),
    ContextMenuMixin = jquerycontextmenulib.mixins.ContextMenu,
    o = templateslib.override,
    m = htmltemplateslib,
    HeartbeatHandlerMixin = chatweblib.mixins.HeartbeatHandler;

  function optionsstring (options, name, dflt) {
    var p, ret;
    if (!options) {
      return dflt;
    }
    ret = lib.readPropertyFromDotDelimitedString(options, name);
    return lib.isVal(ret) ? ret+' '+dflt : dflt;
  }
  
  function ChatMessageElement (id, options) {
    options.elements = options.elements || [];
    options.data_markup = options.data_markup || this.createDataMarkup(options.data_markup_options);
    DataAwareElement.call(this, id, options);
    ContextMenuMixin.call(this);
    HeartbeatHandlerMixin.call(this);
    this.MessageParser = new messageparsinglib.Parser();
    this.dontupdatebefore = Date.now();
  }
  lib.inherit(ChatMessageElement, DataAwareElement);
  ContextMenuMixin.addMethods(ChatMessageElement);
  HeartbeatHandlerMixin.addMethods(ChatMessageElement);
  ChatMessageElement.prototype.__cleanUp = function () {
    this.dontupdatebefore = null;
    if (this.MessageParser) {
      this.MessageParser.destroy();
    }
    this.MessageParser = null;
    HeartbeatHandlerMixin.prototype.destroy.call(this);
    ContextMenuMixin.prototype.destroy.call(this);
    DataAwareElement.prototype.__cleanUp.call(this);
  };
  ChatMessageElement.prototype.set_data = function (item) {
    var ret;
    item.message = chatweblib.processMessage(item.message);
    this.updateHumanReadableCreated(item);
    ret = DataAwareElement.prototype.set_data.call(this, item);
    return ret;
  };
  /**/
  ChatMessageElement.prototype.updateFromRcvd = function (rcvdmsg) {
    var mydata;
    //console.log('updateFromRcvd?', rcvdmsg);
    if (!(rcvdmsg && rcvdmsg.messageid)) {
      return;
    }
    mydata = this.get('data');
    updatercvdseen(mydata, 'rcvd', rcvdmsg);
    //console.log('gledajsad updateFromRcvd', mydata);
    this.set_data(mydata);
  };
  ChatMessageElement.prototype.updateFromSeen = function (seenmsg) {
    var mydata;
    //console.log('updateFromSeen?', seenmsg);
    if (!(seenmsg && seenmsg.messageid)) {
      return;
    }
    mydata = this.get('data');
    updatercvdseen(mydata, 'seen', seenmsg);
    //console.log('gledajsad updateFromSeen', mydata);
    this.set_data(mydata);
  };
  ChatMessageElement.prototype.updateFromEdit = function (editedmsg) {
    var mydata;
    if (!(editedmsg && editedmsg.message && editedmsg.moment)) {
      return;
    }
    mydata = this.get('data');
    if (!lib.isArray(mydata.edits)) {
      mydata.edits = [[mydata.message, mydata.created]];
    } else {
      mydata.edits.push([mydata.message, mydata.created]);
    }
    mydata.message = editedmsg.message;
    mydata.created = editedmsg.moment;
    this.set_data(mydata);
  };
  ChatMessageElement.prototype.updatePreview = function (preview) {
    var mydata;
    /*
    if (!(preview && (preview.title || preview.description || preview.image))) {
      return;
    }
    */
    mydata = this.get('data');
    mydata.preview = preview;
    this.set_data(mydata);
  };
  ChatMessageElement.prototype.parseMessage = function (message) {
    return this.MessageParser.parse(message);
  };
  ChatMessageElement.prototype.updateHumanReadableCreated = function (d, now) {
    var d, had_d, time;
    if (!this.destroyed) {
      return;
    }
    had_d = !!d;
    d = d || this.get('data');
    if (!(d && d.created)) {
      return;
    }
    time = d.lastedited || d.created;
    if (!had_d) {
      //this.updateHashField('created_humanreadable', ago(time));
      //console.log('oli messageago?', this.$element.find('.messageago')[0], '=>', ago(time));
      this.$element.find('.messageago').text(ago(time));
      //return;
    } else {
      d.created_humanreadable = ago(time);
    }
    this.dontupdatebefore = nextupdate(time, now);
    //lib.runNext(this.updateHumanReadableCreated.bind(this), nexttickinterval(d.created));
  };
  ChatMessageElement.prototype.createDataMarkup = function (options) {
    var mychatclass = optionsstring(options, 'class.mychat', 'mychat'),
      otherschatclass = optionsstring(options, 'class.otherschat', 'otherschat'),
      senderclass = optionsstring(options, 'class.sender', 'chatsender'),
      chatmessageclass = optionsstring(options, 'class.chatmessage', 'chatmessage'),
      messageagoclass = optionsstring(options, 'class.messageago', 'messageago'),
      messageeditedclass = optionsstring(options, 'class.messageedited', 'messageedited'),
      messageseenclass = optionsstring(options, 'class.messageseen', 'messageseen'),
      messagercvdclass = optionsstring(options, 'class.messagercvd', 'messagercvd'),
      retContent;

    retContent = [o(m.span,
      'CLASS', chatmessageclass,
      'CONTENTS', '{{this.parseMessage(item.message)}}'
    ),o(m.div,
      'CLASS', 'chatmessagepreview Preview',
      'ATTRS', 'style="display:{{(item.preview && (item.preview.title || item.preview.description || item.preview.image)) ? \'block\' : \'none\'}}"',
      'CONTENTS', [o(m.span,
        'CLASS', 'previewtitle Title',
        'ATTRS', 'style="display:{{(item.preview && item.preview.title) ? \'block\' : \'none\'}}"',
        'CONTENTS', '{{item.preview.title}}'
      ),o(m.span,
        'CLASS', 'previewdescription Description',
        'ATTRS', 'style="display:{{(item.preview && item.preview.description) ? \'block\' : \'none\'}}"',
        'CONTENTS', '{{item.preview.description}}'
      ),o(m.img,
        'CLASS', 'previewimage Image',
        'ATTRS', 'style="display:{{(item.preview && item.preview.image) ? \'block\' : \'none\'}}" src="{{item.preview.image}}"',
        'CONTENTS', '{{item.preview.description}}'
      )]
    ),o(m.div,
      'CLASS', 'chatmessagemetainfo',
      'CONTENTS', [o(m.span,
        'CLASS', messageeditedclass,
        'ATTRS', 'style="display:{{lib.isArray(item.edits) ? \'inline\' : \'none\'}}"',
        'CONTENTS', 'Edited'
      ),o(m.span,
        'CLASS', messageagoclass,
        'CONTENTS', '{{item.created_humanreadable}}'
      ),o(m.span,
        'CLASS', messagercvdclass,
        'ATTRS', 'style="display:{{(this.isMessageRcvd(item) && !this.isMessageSeen(item)) ? \'inline\' : \'none\'}}"',
        'CONTENTS', ''
      ),o(m.span,
        'CLASS', messageseenclass,
        'ATTRS', 'style="display:{{this.isMessageSeen(item) ? \'inline\' : \'none\'}}"',
        'CONTENTS', ''
      )]
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
  };
  ChatMessageElement.prototype.onContextMenu_edit = function () {
    this.__parent.__parent.doEdit(this.get('data'));
  };
  ChatMessageElement.prototype.handleHeartbeat = function (timestamp) {
    if (timestamp < this.dontupdatebefore) {
      return;
    }
    this.updateHumanReadableCreated(null, timestamp);
  };
  ChatMessageElement.prototype.isMessageSeen = function (item) {
    //console.log('isMessageSeen?', item);
    if (!item) {
      return false;
    }
    if (item.from !== null) {
      return false;
    }
    return lib.isArray(item.seenby) ? item.seenby.some(seener) : item.seen;
  };
  ChatMessageElement.prototype.isMessageRcvd = function (item) {
    //console.log('isMessageRcvd?', item);
    if (!item) {
      return false;
    }
    if (item.from !== null) {
      return false;
    }
    return lib.isArray(item.rcvdby) ? item.rcvdby.some(rcvder) : item.rcvd;
  };
  function seener (item) {
    return !!item.seen;
  }
  function rcvder (item) {
    return !!item.rcvd;
  }
  ChatMessageElement.prototype.containedMessageSeenByMe = function () {
    var d = this.get('data');
    if (d.from === null) {
      return true; //I sent this msg
    }
    if (d.seen) {
      return true;
    }
    if (lib.isArray(d.seenby)) {
      return d.seenby.some(hasmeseen);
    }
    return false;
  };
  function hasmeseen (seenbyitem) {
    return (seenbyitem.u===null && lib.isNumber(seenbyitem.seen));
  }
  function hasmeunseen (seenbyitem) {
    return (seenbyitem.u===null && seenbyitem.seen===null);
  }

  function ago (time, now) {
    var diff, prefix;
    now = now || Date.now();
    diff = now-time;
    prefix = (diff>0) ? '' : 'in the future';
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

  function nextupdate (time, now) {
    now = now || Date.now();
    if (!lib.isNumber(time)) {
      return now+lib.intervals.Second;
    }
    if (now - time < lib.intervals.Minute) {
      return now+lib.intervals.Second;
    }
    if (now - time < lib.intervals.Hour) {
      return now+lib.intervals.Minute;
    }
    return now+lib.intervals.Hour;
  }

  function updatercvdseen (data, propname, msg) {
    var datapropname, prop, who, when;
    datapropname = propname+'by';
    who = msg[datapropname];
    when = msg[propname+'at'];
    prop = data[datapropname];
    if (lib.isArray(prop)) {
      prop.some(changer.bind(null, who, when, propname));
      who = null;
      when = null;
      propname = null;
      return;
    }
    if (who === '') { //other side's messages in p2p will not be updated dynamically
      data[propname] = when;
      return;
    }
  }

  function changer (who, when, propname, item) {
    if (item && item.u === who) {
      item[propname] = when;
    }
  }

  applib.registerElementType('ChatMessage', ChatMessageElement);
}

module.exports = createChatMessageElement;
