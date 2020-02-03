function createElements (lib, applib, templateslib, htmltemplateslib, utils) {
  'use strict';

  require('./chatmessagecreator')(lib, applib, templateslib, htmltemplateslib, utils);
  require('./conversationbriefcreator')(lib, applib, templateslib, htmltemplateslib, utils);
  require('./conversationscreator')(lib, applib, templateslib, htmltemplateslib, utils);
  require('./conversationhistorycreator')(lib, applib, templateslib, htmltemplateslib, utils);
  require('./conversationmessagescreator')(lib, applib, templateslib, htmltemplateslib, utils);
}

module.exports = createElements;
