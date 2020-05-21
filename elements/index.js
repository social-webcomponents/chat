function createElements (lib, applib, jquerylib, templateslib, htmltemplateslib, chatweblib, messageparsinglib, jquerycontextmenulib, bufftriglib, utils) {
  'use strict';

  require('./interfacecreator')(lib, applib, templateslib, htmltemplateslib, chatweblib, utils);
  require('./chatmessagecreator')(lib, applib, templateslib, htmltemplateslib, chatweblib, messageparsinglib, jquerycontextmenulib, utils);
  require('./conversationbriefcreator')(lib, applib, templateslib, htmltemplateslib, chatweblib, utils);
  require('./conversationscreator')(lib, applib, templateslib, htmltemplateslib, utils);
  require('./conversationhistorycreator')(lib, applib, templateslib, htmltemplateslib, chatweblib, utils);
  require('./conversationhistoryheadercreator')(lib, applib, jquerylib, templateslib, htmltemplateslib, chatweblib, utils);
  require('./conversationmessagescreator')(lib, applib, jquerylib, templateslib, htmltemplateslib, chatweblib, utils);
  require('./modescreator')(lib, applib, jquerylib, templateslib, htmltemplateslib, utils);
  require('./sendformcreator')(lib, applib, jquerylib, templateslib, htmltemplateslib, bufftriglib, utils);
}

module.exports = createElements;
