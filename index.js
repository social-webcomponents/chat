(function createChatWebComponent (execlib) {

  var lib = execlib.lib,
    lR = execlib.execSuite.libRegistry,
    applib = lR.get('allex_applib'),
    jquerylib = lR.get('allex_jqueryelementslib'),
    jquerycontextmenulib = lR.get('allex_jquerycontextmenuweblib'),
    templateslib = lR.get('allex_templateslitelib'),
    htmltemplateslib = lR.get('allex_htmltemplateslib'),
    chatweblib = lR.get('social_chatweblib'),
    messageparsinglib = lR.get('social_messageparsinglib'),
    bufftriglib = lR.get('allex_bufferedtriggerlib'),
    utils = require('./utils')(lib);

  require('./elements')(lib, applib, jquerylib, templateslib, htmltemplateslib, chatweblib, messageparsinglib, jquerycontextmenulib, bufftriglib, utils);
  require('./modifiers')(lib, applib, templateslib, htmltemplateslib, utils);
  require('./prepreprocessors')(lib, applib);
})(ALLEX);
