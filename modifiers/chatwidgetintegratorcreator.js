function createChatWidgetIntegrator (lib, applib) {
  'use strict';

  var BasicModifier = applib.BasicModifier;

  function plainUserNameForIder () {
  }

  function doTheNeedGroupCandidates (pp, chatinterfacename, logic, cgh) {
    //var cgh = this.config.chatgrouphandling,
    var pathtochatgroupcreator, groupcandidatesproducer;
    if (!cgh) {
      return;
    }
    cgh.needgroupcandidates = cgh.needgroupcandidates || {};
    pathtochatgroupcreator = cgh.needgroupcandidates.chatgroupcreatorpath || 'Chats.ChatGroupCreator';
    groupcandidatesproducer = cgh.needgroupcandidates.producer;
    if (!lib.isFunction(groupcandidatesproducer)) {
      return;
    }
    logic.push({
      triggers: pp+'.'+chatinterfacename+'!needGroupCandidates',
      references: pp+'.'+chatinterfacename+'.'+pathtochatgroupcreator+','+cgh.needgroupcandidates.references,
      handler: function () {
        var args = Array.prototype.slice.call(arguments),
          chatgroupcreatorel = args[0],
          data;
        //evnt = args[args.length-1];
        data = groupcandidatesproducer.apply(null, args.slice(1, -1));
        data = lib.isArray(data) ? data.slice() : null;
        chatgroupcreatorel.set('data', {candidates: data});
        chatgroupcreatorel.set('actual', !!data);
      }
    });
    logic.push({
      triggers: pp+'.'+chatinterfacename+'!needGroupInfoDisplay',
      references: pp+'.'+chatinterfacename+'.'+pathtochatgroupcreator+','+cgh.needgroupcandidates.references,
      handler: function () {
        var args = Array.prototype.slice.call(arguments),
          chatgroupcreatorel = args[0],
          groupdata = args[args.length-1],
          data;
        //evnt = args[args.length-1];
        data = groupcandidatesproducer.apply(null, args.slice(1, -1));
        data = lib.isArray(data) ? data.slice() : null;
        console.log('needGroupInfoDisplay for group', groupdata);
        chatgroupcreatorel.set('data', {group: groupdata, candidates: data});
        chatgroupcreatorel.set('actual', !!data);
      }
    });
  }

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
      handler: function (iccwufunc, userids) {
        //console.log('needInitiations', userids);
        iccwufunc([userids]);
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
        console.log('got initiations', icc.result);
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
        sendChatMessage([evnt.togroup, evnt.to, evnt.message_text, evnt.options]);
      }
    },{
      triggers: pp+'.'+chatinterfacename+'!messageToEdit',
      references: '.>editChatMessage'+rlm,
      handler: function(editChatMessage, evnt){
        console.log('editChatMessage', evnt);
        editChatMessage([evnt.convid, evnt.id, evnt.message_text, evnt.options]);
      }
    },{
      triggers: pp+'.'+chatinterfacename+'!active',
      references: '.>reportChatActivity'+rlm,
      handler: function(reportChatActivity, evnt){
        console.log('reportChatActivity', evnt);
        reportChatActivity([evnt.convid]);
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
    },{
      triggers: pp+'.'+chatinterfacename+'!needUserNameForId',
      references: pp+'.'+chatinterfacename,
      handler: function (itf, queryobj) {
        queryobj.username = queryobj.userid;
        itf.userNameForId(queryobj);
      }
    });
    //handle the needUserNameForId
    /*
    logic.push({
    });
    */
    //handle the needGroupCandidates
    if (this.config.chatgrouphandling) {
      doTheNeedGroupCandidates(pp, chatinterfacename, logic, this.config.chatgrouphandling);
    }
    //endof needGroupCandidates
    //handle createNewChatGroupWithMembers
    if (this.config.createnewchatgroupwithmemberstrigger) {
      logic.push({
        triggers: this.config.createnewchatgroupwithmemberstrigger,
        references: '.>createNewChatGroupWithMembers'+rlm,
        handler: function (cncgwmfunc, evnt) {
          console.log(evnt);
          cncgwmfunc([evnt.name, evnt.members]);
        }
      });
    }
    //endof handle createNewChatGroupWithMembers
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

