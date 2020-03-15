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
    var pp = this.config.chatwidgetparentpath,
      chatinterfacename = this.config.interfacename || 'Chat';

    logic.push({
      triggers: pp+'.'+chatinterfacename+'!needInitiations',
      references: '.>initiateChatConversationsWithUsers',
      handler: function (getChatConversations, userids) {
        console.log('needInitiations', userids);
        //getChatConversations([need]);
        getChatConversations([userids]);
      }
    },{
      triggers: '.>initiateChatConversationsWithUsers',
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
      triggers: 'datasource.chatnotification:data',
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
      references: '.>getChatMessages',
      handler: function (getChatMessages, need) {
        console.log('needMessages', need);
        getChatMessages([need.id, need.oldest, lib.isNumber(need.howmany) ? need.howmany : 20]);
      }
    },{
      triggers: pp+'.'+chatinterfacename+'!messageToSend',
      references: '.>sendChatMessage',
      handler: function(sendChatMessage, evnt){
        console.log(evnt);
        sendChatMessage([evnt.togroup, evnt.to, evnt.message_text]);
      }
    },{
      triggers: pp+'.'+chatinterfacename+'!messageSeen',
      references: '.>markMessageSeen',
      handler: function (markMessageSeen, need) {
        markMessageSeen([need.convid, need.msgid]);
      }
    },{
      triggers: '.>getChatMessages',
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
        references: '.>getChatConversations',
        handler: function(gcc, myactual, initialized){
          console.log('Chatinitialized', initialized);
          if (myactual && initialized) {
            console.log('off to getChatConversations');
            gcc([]);
          }
        }
      },{
        triggers: '.>getChatConversations',
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

