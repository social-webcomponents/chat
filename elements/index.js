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
