function createInitChatPrePreprocessor (lib, applib) {
  'use strict';

  var BasicProcessor = applib.BasicProcessor;

  function InitChatPrePreprocessor () {
    BasicProcessor.call(this);
  }
  lib.inherit(InitChatPrePreprocessor, BasicProcessor);
  function commander (envname, rlm, fnname) {
    return {
      environment: envname,
      entity: {
        name: fnname, //+rlm,
        options: {
          sink: '.',
          name: fnname //+rlm
        }
      }
    };
  }
  function allexstatedser (envname, rlm, dsname) {
    return {
      environment: envname,
      entity: {
        name: dsname, //+rlm,
        type: 'allexstate',
        options: {
          sink: '.',
          path: dsname //+rlm
        }
      }
    };
  }
  InitChatPrePreprocessor.prototype.process = function (desc) {
    var env = this.config.environment,
      rlm = this.config.rwcrealm;
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

  InitChatPrePreprocessor.prototype.neededConfigurationNames = ['environment', 'rwcrealm'];

  applib.registerPrePreprocessor('ChatInit', InitChatPrePreprocessor);
}
module.exports = createInitChatPrePreprocessor;
