(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
function createChatConversationBrief (lib, applib, templateslib, htmltemplateslib, chatweblib, utils) {
  'use strict';

  var DataAwareElement = applib.getElementType('DataAwareElement'),
    o = templateslib.override,
    p = templateslib.process,
    m = htmltemplateslib,
    ChatConversationBriefMixin = chatweblib.mixins.ChatConversationBrief;


  function ChatConversationBriefElement (id, options) {
    DataAwareElement.call(this, id, options);
    ChatConversationBriefMixin.call(this);
  }
  lib.inherit(ChatConversationBriefElement, DataAwareElement);
  ChatConversationBriefMixin.addMethods(ChatConversationBriefElement);
  ChatConversationBriefElement.prototype.__cleanUp = function () {
    ChatConversationBriefMixin.prototype.destroy.call(this);
    DataAwareElement.prototype.__cleanUp.call(this);
  };
  ChatConversationBriefElement.prototype.set_data = function (data) {
    ChatConversationBriefMixin.prototype.handleConversationData.call(this, data);
    return DataAwareElement.prototype.set_data.call(this, data);
  };

  applib.registerElementType('ChatConversationBriefElement', ChatConversationBriefElement);

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
    this.needMessages = this.createBufferableHookCollection();
    this.messageSeen = this.createBufferableHookCollection();
    this.conversationChanged = this.createBufferableHookCollection();
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
    if (this.conversationChanged) {
      this.conversationChanged.destroy();
    }
    this.conversationChanged = null;
    if (this.messageSeen) {
      this.messageSeen.destroy();
    }
    this.messageSeen();
    if (this.needMessages) {
      this.needMessages.destroy();
    }
    this.needMessages = null;
    DataElementFollowerMixin.prototype.destroy.call(this);
    DataAwareElement.prototype.__cleanUp.call(this);
  };
  ChatConversationHistoryElement.prototype.onMasterDataChanged = function (data) {
    if (!lib.isVal(data)) {
      this.chatId = null;
      this.set('data', data);
      return;
    }
    if (data.id !== this.chatId && data.chatId !== this.chatId) {
      this.chatId = data.chatId || data.id;
      this.conversationChanged.fire(this.chatId);
      this.askForMessages();
    }
    this.set('data', data);
  };
  ChatConversationHistoryElement.prototype.askForMessages = function () {
    var oldest = lib.isNumber(this.oldestMessageId) ? this.oldestMessageId-1 : null;
    this.needMessages.fire({id: this.chatId, oldest: oldest, howmany: this.getConfigVal('pagesize')});
  };

  applib.registerElementType('ChatConversationHistory', ChatConversationHistoryElement);
}

module.exports = createChatConversationHistory;

},{}],4:[function(require,module,exports){
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
    this.selected = this.createBufferableHookCollection();
    this.needGroupCandidates = this.createBufferableHookCollection();
    this.selectedItemId = null;
  }
  lib.inherit(ChatConversationsElement, FromDataCreator);
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


  applib.registerElementType('ChatConversationsElement', ChatConversationsElement);
}

module.exports = createChatConversationsElement;

},{}],6:[function(require,module,exports){
function createElements (lib, applib, jquerylib, templateslib, htmltemplateslib, chatweblib, utils) {
  'use strict';

  require('./interfacecreator')(lib, applib, templateslib, htmltemplateslib, chatweblib, utils);
  require('./chatmessagecreator')(lib, applib, templateslib, htmltemplateslib, chatweblib, utils);
  require('./conversationbriefcreator')(lib, applib, templateslib, htmltemplateslib, chatweblib, utils);
  require('./conversationscreator')(lib, applib, templateslib, htmltemplateslib, utils);
  require('./conversationhistorycreator')(lib, applib, templateslib, htmltemplateslib, utils);
  require('./conversationmessagescreator')(lib, applib, jquerylib, templateslib, htmltemplateslib, utils);
}

module.exports = createElements;

},{"./chatmessagecreator":1,"./conversationbriefcreator":2,"./conversationhistorycreator":3,"./conversationmessagescreator":4,"./conversationscreator":5,"./interfacecreator":7}],7:[function(require,module,exports){
function createChatInterface (lib, applib, templateslib, htmltemplateslib, chatweblib, utils) {
  'use strict';

  var WebElement = applib.getElementType('WebElement'),
    ChatInterfaceMixin = chatweblib.mixins.Interface;

  function ChatInterfaceElement (id, options) {
    WebElement.call(this, id, options);
    ChatInterfaceMixin.call(this);
    this.data = null;
  }
  lib.inherit(ChatInterfaceElement, WebElement);
  ChatInterfaceMixin.addMethods(ChatInterfaceElement);
  ChatInterfaceElement.prototype.__cleanUp = function () {
    this.data = null;
    ChatInterfaceMixin.prototype.destroy.call(this);
    WebElement.prototype.__cleanUp.call(this);
  };
  applib.registerElementType('ChatInterface', ChatInterfaceElement);

}
module.exports = createChatInterface;

},{}],8:[function(require,module,exports){
(function createChatWebComponent (execlib) {

  var lib = execlib.lib,
    lR = execlib.execSuite.libRegistry,
    applib = lR.get('allex_applib'),
    jquerylib = lR.get('allex_jqueryelementslib'),
    templateslib = lR.get('allex_templateslitelib'),
    htmltemplateslib = lR.get('allex_htmltemplateslib'),
    chatweblib = lR.get('social_chatweblib'),
    utils = require('./utils')(lib);

  require('./elements')(lib, applib, jquerylib, templateslib, htmltemplateslib, chatweblib, utils);
  require('./modifiers')(lib, applib, templateslib, htmltemplateslib, utils);
  require('./prepreprocessors')(lib, applib);
})(ALLEX);

},{"./elements":6,"./modifiers":11,"./prepreprocessors":12,"./utils":14}],9:[function(require,module,exports){
function createChatWidget (lib, applib, templateslib, htmltemplateslib, utils) {
  'use strict';

  var o = templateslib.override,
    m = htmltemplateslib,
    p = templateslib.process,
    BasicModifier = applib.BasicModifier,
    zeroString=String.fromCharCode(0);

  var __SENTMESSAGECOUNT=0;

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
          'CONTENTS', 'Send'
        )
      ]
    )
  }

  function ChatWidgetModifier (options) {
    BasicModifier.call(this, options);
  }
  lib.inherit(ChatWidgetModifier, BasicModifier);
  ChatWidgetModifier.prototype.doProcess = function (name, options, links, logic, resources) {
    var config = this.config || {},
      widgetname,
      chatsname,
      historyname;

    config.widget = config.widget || {};
    config.types = config.types || {};
    config.names = config.names || {};

    widgetname = config.widget.name || config.names.interface || 'Chat';
    chatsname = config.names.chats || 'Chats';
    historyname = config.names.history || 'ChatHistory';
      
    options.elements.push({
      name: widgetname,
      type: config.types.interface || 'ChatInterface',
      options: this.widgetOptions(config.widget, config.types, config.names),
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
      logic: [{
        triggers: '.:lastnotification',
        references: '.,.'+historyname+'.Messages',
        handler: function (me, msgs, ln) {
          //console.log('lastnotification', ln);
          if (!(me && me.activechat && (me.activechat.id === ln.id || me.activechat.chatId === ln.id))) {
            return;
          }
          //console.log('lastnotification ok');
          if (ln && ln.conv) {
            msgs.appendData([ln.conv.lastm]);
          }
          //return (ln && ln.conv) ? [ln.conv.lastm] : null;
        }
      }],
      links: [{
        source: '.:data',
        target: chatsname+':data',
        //filter: utils.distinctSenders
      },{
        source: '.'+chatsname+'!selected',
        target: '.:activechat'
      },{
        source: '.'+chatsname+'!needGroupCandidates',
        target: '.!needGroupCandidates'
      },{
        source: '.:activechat',
        target: '.'+historyname+':datamaster'
      },{
        source: '.:chatmessages',
        target: '.'+historyname+'.Messages>prependData'
      },{
        source: '.'+historyname+'!conversationChanged',
        target: '.:chatmessages',
        filter: function () {
          return null;
        }
      },{
        source: '.'+historyname+'!messageSeen',
        target: '.>handleMessageSeen'
      },{
        source: '.'+historyname+'!needMessages',
        target: '.!needMessages'
      },{
        source: '.'+historyname+'!send',
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
  ChatWidgetModifier.prototype.widgetOptions = function (params, types, names) {
    var chatsname,
      historyname,
      createchatgroupname,
      chatgroupcreatorname;
    params = params || {};

    names = names || {};

    chatsname = names.chats || 'Chats';
    historyname = names.history || 'ChatHistory';
    createchatgroupname = names.createchatgroup || 'CreateChatGroup';
    chatgroupcreatorname = names.chatgroupcreator || 'ChatGroupCreator';

    return {
      actual: params.actual,
      self_selector: '.',
      default_markup: o(m.div,
        'CLASS', params.ChatClass || ''
      ),
      elements: [{
        name: chatsname,
        type: types.chats || 'ChatConversationsElement',
        options: lib.extend({
          actual: true,
          self_selector: '.',
          default_markup: o(m.div,
            'CLASS', params.ChatsClass || ''
          ),
          elements: [{
            name: createchatgroupname,
            type: types.createchatgroup || 'ClickableElement',
            options: lib.extend({
            }, params.createchatgroup)
          },{
            name: chatgroupcreatorname,
            type: types.chatgroupcreator || '', //!TODO: should come up with a default ChatGroupCreator type
            options: lib.extend({
            }, params.chatgroupcreator)
          }],
          subDescriptorFromData: function (item) {
            return {
              name: item.id.replace(zeroString, '___'),
              type: types.conversationbrief || 'ChatConversationBriefElement',
              options: lib.extend({
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
                  type: types.message || 'ChatMessage',
                  options: {
                    actual: true,
                    self_selector: '.',
                    data_markup_options: params.lastmessage,
                    data: item.conv.lastm
                  }
                },{
                  name: 'UnreadMessages',
                  type: 'WebElement',
                  options: {
                    actual: false,
                    self_selector: '.',
                    default_markup: o(m.div,
                      'CONTENTS', 'GDE SU UNREAD MESSAGES?'
                    )
                  }
                }]
              }, params.conversationbrief)
            }
          }
        }, params.chats),
        links: [/*{
          source: '.'+createchatgroupname+'!clicked',
          target: '.'+chatgroupcreatorname+':actual',
          filter: function () {
            console.log('reklo bi se da je CreateChatGroup kliknut');
            return true;
          }
        }*/{
          source: '.'+createchatgroupname+'!clicked',
          target: '.!needGroupCandidates'
        }]
      },{
        name: historyname,
        type: types.history || 'ChatConversationHistory',
        options: lib.extend({
          //actual: true,
          self_selector: '.',
          default_markup: o(m.div,
            'CLASS', params.ChatHistoryClass || ''
          ),
          elements: [{
            name: 'Header',
            type: types.historyheader || 'DataAwareChild',
            options: lib.extend({
              actual: true,
              self_selector: '.',
              default_markup: '<div><span class="chathistoryheadernick"></span></div>',
              onMasterDataChanged: function (me, data) {
                me.$element.find('.chathistoryheadernick').text(
                  lib.isVal(data) ? data.conv.name || data.resolve : ''
                );
              }
            }, params.historyheader)
          },{
            name: 'Messages',
            type: types.messages || 'ChatConversationMessages',
            options: lib.extend({
              actual: true,
              self_selector: '.',
              skip_purge_subelements: true,
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
              elements: [{
                name: 'UnreadMessages',
                type: 'WebElement',
                options: {
                  self_selector: '.',
                  default_markup: o(m.div
                  )
                }
              }]
            }, params.messages)
          },{
            name: 'Send',
            type: 'AngularFormLogic',
            options: {
              actual: true,
              self_selector: 'attrib:chatelement',
              default_markup: createSendMessageForm(params.sendmessageform)
            }/*,
            this modifier will double the clicks because
              the button will fire 'submit' on the form
              the modifier will run 'submitForm' on the AngularFormLogic
            modifiers: [{
              name: 'AngularFormLogic.submit',
              options: {
                options: {
                  self_selector: '.'
                }
              }
            }]*/
          }]
        }, params.history),
        links: [{
          source: '.:data',
          target: '.:actual'
        },{
          source: '.Messages!messageSeen',
          target: '.!messageSeen'
        }],
        logic: [{
          triggers: '.Messages!needOlder',
          references: '.',
          handler: function (me, noevnt) {
            me.oldestMessageId = noevnt;
            me.askForMessages();
          }
        },{
          triggers: '.Send!submit',
          references: '.,.Send',
          handler: function (me, form, submitted) {
            var mydata = me.get('data');
            me.send.fire(lib.extend(submitted, {
              togroup: mydata.id,
              to: mydata.resolve
            }));
            form.resetForm();
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

},{}],10:[function(require,module,exports){
function createChatWidgetIntegrator (lib, applib) {
  'use strict';

  var BasicModifier = applib.BasicModifier;

  function ChatWidgetIntegratorModifier (options) {
    if (!('chatwidgetparentpath' in options)) {
      throw new Error('options for '+this.constructor.name+' must have a "chatwidgetparentpath" property');
    }
    BasicModifier.call(this, options);
  }
  lib.inherit(ChatWidgetIntegratorModifier, BasicModifier);

  ChatWidgetIntegratorModifier.prototype.doProcess = function(name, options, links, logic, resources){
    var rlm = this.config.chatrealm,
      pp = this.config.chatwidgetparentpath,
      chatinterfacename = this.config.interfacename || 'Chat';

    if (!rlm) {
      throw new Error('ChatWidgetIntegrator must have a "chatrealm" name in its config');
    }
    rlm = 'On'+rlm;

    logic.push({
      triggers: pp+'.'+chatinterfacename+'!needInitiations',
      references: '.>initiateChatConversationsWithUsers'+rlm,
      handler: function (getChatConversations, userids) {
        console.log('needInitiations', userids);
        //getChatConversations([need]);
        getChatConversations([userids]);
      }
    },{
      triggers: '.>initiateChatConversationsWithUsers'+rlm,
      references: pp+','+pp+'.'+chatinterfacename,
      handler: function (me, itf, icc) {
        if (!me.get('actual')) {
          return;
        }
        if (icc.running) {
          return;
        }
        console.log('got Initiations ', icc.result);
        itf.set('data', icc.result);
      }
    },{
      triggers: 'datasource.chatnotification'+rlm+':data',
      references: pp+','+pp+'.'+chatinterfacename,
      handler: function(me, itf, chatntf){
        /*
        if (!me.get('actual')) {
          return;
        }
        */
        itf.set('lastnotification', chatntf);
      }
    },{
      triggers: pp+'.'+chatinterfacename+'!needMessages',
      references: '.>getChatMessages'+rlm,
      handler: function (getChatMessages, need) {
        console.log('needMessages', need);
        getChatMessages([need.id, need.oldest, lib.isNumber(need.howmany) ? need.howmany : 20]);
      }
    },{
      triggers: pp+'.'+chatinterfacename+'!messageToSend',
      references: '.>sendChatMessage'+rlm,
      handler: function(sendChatMessage, evnt){
        console.log(evnt);
        sendChatMessage([evnt.togroup, evnt.to, evnt.message_text]);
      }
    },{
      triggers: pp+'.'+chatinterfacename+'!messageSeen',
      references: '.>markMessageSeen'+rlm,
      handler: function (markMessageSeen, need) {
        markMessageSeen([need.convid, need.msgid]);
      }
    },{
      triggers: '.>getChatMessages'+rlm,
      references: pp+','+pp+'.'+chatinterfacename,
      handler: function (me, itf, gcm) {
        if (!me.get('actual')) {
          return;
        }
        if (gcm.running) {
          return;
        }
        itf.set('chatmessages', gcm.result);
      }
    });
    //handle the needGroupCandidates
    if (this.config.chatgrouphandling) {
      var cgh = this.config.chatgrouphandling,
        pathtochatgroupcreator = cgh.needgroupcandidates.chatgroupcreatorpath || 'Chats.ChatGroupCreator',
        groupcandidatesproducer = cgh.needgroupcandidates.producer;
      //TODO: check for all the needed sub-fields of cgh
      //like lib.isFunction(groupcandidatesproducer)
      logic.push({
        triggers: pp+'.'+chatinterfacename+'!needGroupCandidates',
        references: pp+'.'+chatinterfacename+'.'+pathtochatgroupcreator+','+cgh.needgroupcandidates.references,
        handler: function () {
          var args = Array.prototype.slice.call(arguments),
            chatgroupcreatorel = args[0],
            data;
          //evnt = args[args.length-1];
          data = groupcandidatesproducer.apply(null, args.slice(1,-1));
          data = lib.isArray(data) ? data.slice() : null;
          chatgroupcreatorel.set('data', data);
          chatgroupcreatorel.set('actual', !!data);
        }
      });
    }
    if (!this.config.skipconversationloading) {
      logic.push({
        triggers: pp+':actual,'+pp+'.'+chatinterfacename+':initialized',
        references: '.>getChatConversations'+rlm,
        handler: function(gcc, myactual, initialized){
          console.log('Chatinitialized', initialized);
          if (myactual && initialized) {
            console.log('off to getChatConversations');
            gcc([]);
          }
        }
      },{
        triggers: '.>getChatConversations'+rlm,
        references: pp+','+pp+'.'+chatinterfacename,
        handler: function (me, itf, gcc) {
          if (!me.get('actual')) {
            return;
          }
          if (gcc.running) {
            return;
          }
          itf.set('data', gcc.result);
        }
      });
    }
  };
  ChatWidgetIntegratorModifier.prototype.DEFAULT_CONFIG = function () {
    return {};
  };

  applib.registerModifier('ChatWidgetIntegrator', ChatWidgetIntegratorModifier);
}
module.exports = createChatWidgetIntegrator;


},{}],11:[function(require,module,exports){
function createModifiers (lib, applib, templateslib, htmltemplateslib, utils) {
  'use strict';

  require('./chatwidgetcreator')(lib, applib, templateslib, htmltemplateslib, utils);
  require('./chatwidgetintegratorcreator')(lib, applib, templateslib, htmltemplateslib, utils);
}

module.exports = createModifiers;

},{"./chatwidgetcreator":9,"./chatwidgetintegratorcreator":10}],12:[function(require,module,exports){
function createPrePreprocessors (lib, applib) {
  'use strict';

  require('./initcreator')(lib, applib);
}
module.exports = createPrePreprocessors;

},{"./initcreator":13}],13:[function(require,module,exports){
function createInitChatPrePreprocessor (lib, applib) {
  'use strict';

  var BasicProcessor = applib.BasicProcessor;

  function InitChatPrePreprocessor () {
    BasicProcessor.call(this);
  }
  lib.inherit(InitChatPrePreprocessor, BasicProcessor);
  function commander (envname, rlm, fnname) {
    console.log(fnname+'On'+rlm);
    return {
      environment: envname,
      entity: {
        name: fnname+'On'+rlm,
        options: {
          sink: '.',
          name: fnname+'On'+rlm
        }
      }
    };
  }
  function allexstatedser (envname, rlm, dsname) {
    console.log(dsname+'On'+rlm);
    return {
      environment: envname,
      entity: {
        name: dsname+'On'+rlm,
        type: 'allexstate',
        options: {
          sink: '.',
          path: dsname+'On'+rlm
        }
      }
    };
  }
  InitChatPrePreprocessor.prototype.process = function (desc) {
    var env = this.config.environment,
      rlm = this.config.chatrealm;
    desc.preprocessors = desc.preprocessors || {};
    desc.preprocessors.Command = desc.preprocessors.Command || [];
    desc.preprocessors.DataSource = desc.preprocessors.DataSource || [];

    desc.preprocessors.Command.push.apply(desc.preprocessors.Command, [
      'getChatMessages',
      'initiateChatConversationsWithUsers',
      'getChatConversations',
      'sendChatMessage',
      'markMessageRcvd',
      'markMessageSeen'
    ].map(commander.bind(null, env, rlm)));
    desc.preprocessors.DataSource.push.apply(desc.preprocessors.DataSource, [
      'chatnotification',
    ].map(allexstatedser.bind(null, env, rlm)));


    env = null;
    rlm = null;
  };

  InitChatPrePreprocessor.prototype.neededConfigurationNames = ['environment', 'chatrealm'];

  applib.registerPrePreprocessor('ChatInit', InitChatPrePreprocessor);
}
module.exports = createInitChatPrePreprocessor;

},{}],14:[function(require,module,exports){
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

},{}]},{},[8]);
