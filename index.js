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
