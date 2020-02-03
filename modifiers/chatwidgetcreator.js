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
