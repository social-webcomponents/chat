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
