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
        target: '.:activechat',
        filter: function passthru (thingy) {
          return thingy;
        }
      },{
        source: '.!forgetSelected',
        target: '.'+chatsname+'>forgetSelected'
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
