function createModifiers (lib, applib, templateslib, htmltemplateslib, utils) {
  'use strict';

  require('./chatwidgetcreator')(lib, applib, templateslib, htmltemplateslib, utils);
}

module.exports = createModifiers;
