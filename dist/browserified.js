(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function createChatMessageElement (lib, applib, templateslib, htmltemplateslib, utils) {
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
    if (!options.skipSenderName){
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

},{}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
function createChatConversationHistory (lib, applib, templateslib, htmltemplateslib, utils) {
  'use strict';

  var DataAwareElement = applib.getElementType('DataAwareElement'),
    DataElementFollowerMixin = applib.mixins.DataElementFollowerMixin;

  function ChatConversationHistoryElement (id, options) {
    DataAwareElement.call(this, id, options);
    DataElementFollowerMixin.call(this);
    this.needMessages = new lib.HookCollection();
    this.send = new lib.HookCollection();
    this.chatId = null;
    this.oldestMessageId = null;
  }
  lib.inherit(ChatConversationHistoryElement, DataAwareElement);
  DataElementFollowerMixin.addMethods(ChatConversationHistoryElement);
  ChatConversationHistoryElement.prototype.__cleanUp = function () {
    this.oldestMessageId = null;
    this.chatId = null;
    if (this.send) {
      this.send.destroy();
    }
    this.send = null;
    if (this.needMessages) {
      this.needMessages.destroy();
    }
    this.needMessages = null;
    DataElementFollowerMixin.prototype.destroy.call(this);
    DataAwareElement.prototype.__cleanUp.call(this);
  };
  ChatConversationHistoryElement.prototype.onMasterDataChanged = function (data) {
    console.log('oli onMasterDataChanged?', data);
    if (data.id !== this.chatId) {
      this.chatId = data.id;
      this.askForMessages();
    }
    this.set('data', data);
  };
  ChatConversationHistoryElement.prototype.askForMessages = function () {
    this.needMessages.fire({id: this.chatId, oldest: this.oldestMessageId, howmany: this.getConfigVal('pagesize')});
  };

  applib.registerElementType('ChatConversationHistory', ChatConversationHistoryElement);
}

module.exports = createChatConversationHistory;

},{}],4:[function(require,module,exports){
function createChatConversationMessages (lib, applib, templateslib, htmltemplateslib, utils) {
  'use strict';

  var FromDataCreator = applib.getElementType('FromDataCreator'),
    DataElementFollowerMixin = applib.mixins.DataElementFollowerMixin;

  function ChatConversationMessagesElement (id, options) {
    FromDataCreator.call(this, id, options);
    DataElementFollowerMixin.call(this);
  }
  lib.inherit(ChatConversationMessagesElement, FromDataCreator);
  DataElementFollowerMixin.addMethods(ChatConversationMessagesElement);
  ChatConversationMessagesElement.prototype.__cleanUp = function () {
    DataElementFollowerMixin.prototype.destroy.call(this);
    FromDataCreator.prototype.__cleanUp.call(this);
  };
  ChatConversationMessagesElement.prototype.onMasterDataChanged = function (data) {
    this.set('data', lib.isVal(data) ? data.messages : null);
  };

  ChatConversationMessagesElement.prototype.postInitializationMethodNames = FromDataCreator.prototype.postInitializationMethodNames.concat('startListeningToParentData');


  applib.registerElementType('ChatConversationMessages', ChatConversationMessagesElement);
}

module.exports = createChatConversationMessages;

},{}],5:[function(require,module,exports){
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
    this.selected = new lib.HookCollection();
    this.selectedItemId = null;
  }
  lib.inherit(ChatConversationsElement, FromDataCreator);
  ChatConversationsElement.prototype.__cleanUp = function () {
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


  applib.registerElementType('ChatConversations', ChatConversationsElement);
}

module.exports = createChatConversationsElement;

},{}],6:[function(require,module,exports){
function createElements (lib, applib, templateslib, htmltemplateslib, utils) {
  'use strict';

  require('./chatmessagecreator')(lib, applib, templateslib, htmltemplateslib, utils);
  require('./conversationbriefcreator')(lib, applib, templateslib, htmltemplateslib, utils);
  require('./conversationscreator')(lib, applib, templateslib, htmltemplateslib, utils);
  require('./conversationhistorycreator')(lib, applib, templateslib, htmltemplateslib, utils);
  require('./conversationmessagescreator')(lib, applib, templateslib, htmltemplateslib, utils);
}

module.exports = createElements;

},{"./chatmessagecreator":1,"./conversationbriefcreator":2,"./conversationhistorycreator":3,"./conversationmessagescreator":4,"./conversationscreator":5}],7:[function(require,module,exports){
(function createChatWebComponent (execlib) {

  var lib = execlib.lib,
    lR = execlib.execSuite.libRegistry,
    applib = lR.get('allex_applib'),
    templateslib = lR.get('allex_templateslitelib'),
    htmltemplateslib = lR.get('allex_htmltemplateslib'),
    utils = require('./utils')(lib);

  require('./elements')(lib, applib, templateslib, htmltemplateslib, utils);
  require('./modifiers')(lib, applib, templateslib, htmltemplateslib, utils);

})(ALLEX);

},{"./elements":6,"./modifiers":9,"./utils":10}],8:[function(require,module,exports){
function createChatWidget (lib, applib, templateslib, htmltemplateslib, utils) {
  'use strict';

  var o = templateslib.override,
    m = htmltemplateslib,
    p = templateslib.process,
    BasicModifier = applib.BasicModifier,
    WebElement = applib.getElementType('WebElement'),
    zeroString=String.fromCharCode(0);

  var __SENTMESSAGECOUNT=0;

  function ChatInterfaceElement (id, options) {
    WebElement.call(this, id, options);
    this.needMessages = new lib.HookCollection();
    this.messageToSend = new lib.HookCollection();
    this.lastnotification = null;
    this.chatmessages = null;
  }
  lib.inherit(ChatInterfaceElement, WebElement);
  ChatInterfaceElement.prototype.__cleanUp = function () {
    this.chatmessages = null;
    this.lastnotification = null;
    if (this.messageToSend) {
      this.messageToSend.destroy();
    }
    this.messageToSend = null;
    if (this.needMessages) {
      this.needMessages.destroy();
    }
    this.needMessages = null;
    WebElement.prototype.__cleanUp.call(this);
  };
  ChatInterfaceElement.prototype.set_lastnotification = function (data) {
    var mydata = this.get('data'), affectedwi, newaff, newdata,
      mychatmessages;
    if (!lib.isArray(mydata)) {
      return false;
    }
    affectedwi = lib.arryOperations.findElementAndIndexWithProperty(mydata, 'id', data.id);
    if (!(affectedwi && lib.isNumber(affectedwi.index) && affectedwi.element)) {
      return false;
    }
    newaff = lib.extend({}, affectedwi.element);
    if (newaff && newaff.conv && newaff.conv.lastm && newaff.conv.lastm.id !== data.mids[0]) {
      throw new Error('My lastm id', newaff.conv.lastm.id, 'should have matched incoming', data.mids[0]);
    }
    newaff.conv.lastm = lib.extend({id: data.mids[1]}, data.lastmessage);
    newdata = mydata.slice();
    newdata[affectedwi.index] = newaff;
    this.set('data', newdata);

    mychatmessages = this.get('chatmessages');
    if (mychatmessages[mychatmessages.length-1].id === data.mids[0]) {
      this.set('chatmessages', mychatmessages.concat([newaff.conv.lastm]));
    }
    return true;
  };
  applib.registerElementType('ChatInterface', ChatInterfaceElement);

  function createUnreadChatMessages(){
    return o(m.div,
      'CONTENTS', [
        o(m.h3,
          'CONTENTS', 'Unread Messages:',
        ),
        o(m.div,
          'ATTRS', 'data-ng-repeat="message in _ctrl.data"',
          'CONTENTS', '{{message}}'
        )
      ]
    );
  }

  function createSendMessageForm(config){
    if (!config){
      config = {};
    }
    if (!config.class){
      config.class = {};
    }
    return o(m.form,
      'CLASS', (config.class.form || ''),
      'CONTENTS', [
        /*
        o(m.textinput,
          'NAME', 'to',
          'ATTRS', 'placeholder="To" required="required"'
        ),
        */
        o(m.textarea,
          'NAME', 'message_text',
          'ATTRS', 'placeholder="Write a message..." required="required"',
          'CLASS', (config.class.textarea || '')
        ),
        o(m.button,
          'CLASS', 'SendSubmit' + (config.class.button ? ' ' + config.class.button : ''),
          'CONTENTS', 'Send Message'
        )
      ]
    )
  }

  function ChatWidgetModifier (options) {
    BasicModifier.call(this, options);
  }
  lib.inherit(ChatWidgetModifier, BasicModifier);
  ChatWidgetModifier.prototype.doProcess = function (name, options, links, logic, resources) {
    var widgetname = this.config.widget.name || 'Chat';
      
    options.elements.push({
      name: widgetname,
      type: 'ChatInterface',
      options: this.widgetOptions(this.config.widget),
      /*
      logic: [{
        triggers: '.Messages:actual',
        references: '.',
        handler: function(ign, actual){
          if (!!actual){
            console.log('Pokazao se friend unreadMessages, ovde ce da se zove markRead');
          }
        }
      }],
      links: [{
        source: 'SendMessageForm!submit',
        target: '.!messageToSend'
      }]
      */
      links: [{
        source: '.:data',
        target: 'Chats:data',
        //filter: utils.distinctSenders
      },{
        source: '.Chats!selected',
        target: '.ChatHistory:datamaster'
      },{
        source: '.:chatmessages',
        target: '.ChatHistory.Messages:data',
        filter: function (msgs) {
          console.log('chatmessages', msgs);
          return msgs;
        }
      },{
        source: '.ChatHistory!needMessages',
        target: '.!needMessages'
      },{
        source: '.ChatHistory!send',
        target: '.!messageToSend',
        filter: function (tosend) {
          /*
          __SENTMESSAGECOUNT++;
          if (__SENTMESSAGECOUNT>1) {
            throw new Error('Moze samo jedna poruka da se salje');
          }
          */
          return tosend;
        }
      }]
    });
  };
  ChatWidgetModifier.prototype.widgetOptions = function (params) {
    params = params || {};
    return {
      actual: params.actual,
      self_selector: '.',
      default_markup: o(m.div,
        'CLASS', params.ChatClass || ''
      ),
      elements: [{
        name: 'Chats',
        type: 'ChatConversations',
        options: {
          actual: true,
          self_selector: '.',
          default_markup: o(m.div,
            'CLASS', params.ChatsClass || ''
          ),
          subDescriptorFromData: function (item) {
            return {
              name: item.id.replace(zeroString, '___'),
              type: 'ChatConversationBrief',
              options: {
                actual: true,
                self_selector: '.',
                default_markup: o(m.div,
                  'CONTENTS', '',
                  'CLASS', params.ChatBriefContainerClass
                ),
                //data_markup: '<div><div>profile pic of {{item.resolve}}</div><div>nick of {{item.resolve}}</div><div class="LastMessage"></div></div>',
                data_markup: o(m.div,
                  'CONTENTS', [
                    o(m.div,
                      'CLASS', params.ProfilePicClass || '',
                      'CONTENTS', o(m.div,
                        'CLASS', 'profile-pic-container',
                        'CONTENTS', [
                          o(m.div,
                            'CLASS', 'profile-pic-dummy',
                            'CONTENTS', ''
                          ),
                          o(m.div,
                            'CLASS', 'profile-pic-content',
                            'CONTENTS', '{{item.resolve.charAt(0)}}',
                          )
                        ]
                      )
                    ),
                    o(m.div,
                      'CLASS', params.ProfileNickAndLastMessageContainer || '',
                      'CONTENTS', o(m.div,
                      'CONTENTS', [
                        o(m.div,
                          'CLASS', params.ProfileNickClass || '',
                          'CONTENTS', 'Nick of {{item.resolve}}' 
                        ),
                        o(m.div,
                          'CLASS', 'LastMessage' + (params.LastMessageClass ? ' ' + params.LastMessageClass : ''),
                          'CONTENTS', '' 
                        )
                      ])
                    )
                  ],
                  'CLASS', params.ChatBriefClass || ''
                ),
                elements: [{
                  name: 'LastMessage',
                  type: 'ChatMessage',
                  options: {
                    actual: true,
                    self_selector: '.',
                    data_markup_options: params.lastmessage,
                    data: item.conv.lastm
                  }
                }]
              }
            }
          }
        }
      },{
        name: 'ChatHistory',
        type: 'ChatConversationHistory',
        options: {
          //actual: true,
          self_selector: '.',
          default_markup: o(m.div,
            'CLASS', params.ChatHistoryClass || ''
          ),
          elements: [{
            name: 'Header',
            type: 'DataAwareChild',
            options: {
              actual: true,
              self_selector: '.',
              default_markup: '<div><span class="chathistoryheadernick"></span></div>',
              onMasterDataChanged: function (me, data) {
                me.$element.find('.chathistoryheadernick').text(
                  lib.isVal(data) ? data.conv.name || data.resolve : ''
                );
              }
            }
          },{
            name: 'Messages',
            //type: 'ChatConversationMessages',
            type: 'FromDataCreator',
            options: {
              actual: true,
              self_selector: '.',
              default_markup: o(m.div,
                'CLASS', params.MessagesClass || ''
              ),
              subDescriptorFromData: function (item) {
                return {
                  name: 'chatmessage_'+item.id,
                  type: 'ChatMessage',
                  options: {
                    actual: true,
                    self_selector: '.',
                    default_markup: o(m.div,
                      'CLASS', params.ChatMessageClass || 'ChatMessage'
                    ),
                    data_markup_options: params.messages,
                    data: item
                  }
                };
              },
              elements: []
            }
          },{
            name: 'Send',
            type: 'AngularFormLogic',
            options: {
              actual: true,
              self_selector: 'attrib:chatelement',
              default_markup: createSendMessageForm(params.sendmessageform)
            },
            modifiers: [{
              name: 'AngularFormLogic.submit',
              options: {
                options: {
                  self_selector: '.'
                }
              }
            }]
          }]
        },
        links: [{
          source: '.:data',
          target: '.:actual'
        }],
        logic: [{
          triggers: '.Send!submit',
          references: '.',
          handler: function (me, submitted) {
            var mydata = me.get('data');
            me.send.fire(lib.extend(submitted, {
              togroup: mydata.id,
              to: mydata.resolve
            }));
          }
        }]
      }]
    };
  };
  ChatWidgetModifier.prototype.DEFAULT_CONFIG = function () {
    return {};
  };

  applib.registerModifier('ChatWidget', ChatWidgetModifier);
}

module.exports = createChatWidget;

},{}],9:[function(require,module,exports){
function createModifiers (lib, applib, templateslib, htmltemplateslib, utils) {
  'use strict';

  require('./chatwidgetcreator')(lib, applib, templateslib, htmltemplateslib, utils);
}

module.exports = createModifiers;

},{"./chatwidgetcreator":8}],10:[function(require,module,exports){
function createUtils (lib) {
  'use strict';

  var zeroString = String.fromCharCode(0),
    oneString = String.fromCharCode(1);

  function nonValValue (thingy) {
    return lib.isVal(thingy) ? thingy : oneString;
  }
  function fromValue (thingy) {
    return thingy===oneString ? null : thingy;
  }
  function distincter (msgs, result, item) {
    var teststr, _mymsgs;
    if (!(item && item.from)) {
      return result;
    }
    teststr = nonValValue(item.from)
      +zeroString
      +nonValValue(item.from_role)
      +zeroString
      +nonValValue(item.from_realm)
      ;
    if (result.indexOf(teststr) < 0) {
      _mymsgs = [];
      result.push(teststr);
      msgs.add(teststr, _mymsgs);
    } else {
      _mymsgs = msgs.get(teststr);
    }
    if ('message' in item) {
      _mymsgs.push(lib.pick(item, ['id', 'message', 'created', 'seen']));
    }
    return result;
  };

  function breaker (msgs, str) {
    var sp = str.split(zeroString);
    return {
      from: fromValue(sp[0]),
      from_role: fromValue(sp[1]),
      from_realm: fromValue(sp[2]),
      messages: msgs.get(str)
    };
  }

  function distinctSenders (chats) {
    var temp, msgs, ret;

    if (!lib.isArray(chats)) {
      return [];
    }
    msgs = new lib.Map();
    temp = chats.reduce(distincter.bind(null, msgs), []);
    ret = temp.map(breaker.bind(null, msgs));
    msgs.destroy();
    msgs = null;
    return ret;
  }


  return {
    distinctSenders: distinctSenders
  };
}

module.exports = createUtils;

},{}]},{},[7]);
