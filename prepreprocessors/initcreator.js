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
