function createModes (lib, applib, jquerylib, templateslib, htmltemplateslib, utils) {
  'use strict';

  var WebElement = applib.getElementType('WebElement'),
    ChildActualizerMixin = applib.mixins.ChildActualizer,
    o = templateslib.override,
    m = htmltemplateslib;

  function createDefaultMarkup (options) {
    return o(m.div,
      'CLASS', 'hers-modes',
      'CONTENTS', [
        o(m.div,
          'CLASS', 'Link hers-modes-link',
          'CONTENTS', [
            o(m.div,
              'CLASS', 'Contents hers-modes-link-contents'
            ),
            o(m.div,
              'CLASS', 'Cancel hers-modes-cancel',
              'CONTENTS', o(m.span,
                'CLASS', 'icon-preferences'
              )
            )
          ]
        ),
        o(m.div,
          'CLASS', 'Edit hers-modes-edit',
          'CONTENTS', [
            o(m.div,
              'CLASS', 'hers-modes-edit-container',
              'CONTENTS', [
                o(m.span,
                  'CLASS', 'hers-modes-edit-label',
                  'CONTENTS' ,'Edit message'
                ),
                o(m.span,
                  'CLASS', 'Contents hers-modes-edit-contents'
                )
              ]
            ),
            o(m.div,
              'CLASS', 'Cancel hers-modes-cancel',
              'CONTENTS', o(m.span,
                'CLASS', 'icon-preferences'
              )
            )
          ]
        )
      ]
    );
  }

  function ChatModeElement (id, options) {
    options.elements = options.elements || [];
    options.elements.push({
      name: 'Cancel',
      type: 'ClickableElement',
      options: {
        actual: true,
        self_selector: '.',
        ignore_enabled: true
      }
    });
    WebElement.call(this, id, options);
    this.data = null;
  }
  lib.inherit(ChatModeElement, WebElement);
  ChatModeElement.prototype.__cleanUp = function () {
    this.data = null;
    WebElement.prototype.__cleanUp.call(this);
  };
  ChatModeElement.prototype.set_data = function (val) {
    this.data = val;
  };

  applib.registerElementType('ChatModeElement', ChatModeElement);

  function ChatModeWithContentsElement (id, options) {
    ChatModeElement.call(this, id, options);
  }
  lib.inherit(ChatModeWithContentsElement, ChatModeElement);
  ChatModeWithContentsElement.prototype.__cleanUp = function () {
    ChatModeElement.prototype.__cleanUp.call(this);
  };
  ChatModeWithContentsElement.prototype.set_contents = function (val) {
    //simple - for now
    if (!this.$element) {
      return;
    }
    this.$element.find('.Contents').text(val);
  };
  ChatModeWithContentsElement.prototype.get_contents = function () {
    if (!this.$element) {
      return;
    }
    return this.$element.find('.Contents').text();
  };

  applib.registerElementType('ChatModeWithContentsElement', ChatModeWithContentsElement);

  function ChatEditModeElement (id, options) {
    ChatModeWithContentsElement.call(this, id, options);
  };
  lib.inherit(ChatEditModeElement, ChatModeWithContentsElement);
  ChatEditModeElement.prototype.set_data = function (val) {
    ChatModeWithContentsElement.prototype.set_data.call(this, val);
    this.set('contents', val.message);
  };

  applib.registerElementType('ChatEditModeElement', ChatEditModeElement);

  function ChatModesElement (id, options) {
    options.default_markup = options.default_markup || createDefaultMarkup (options.defaultmarkupoptions);
    options.elements = [{
      name: 'Link',
      type: 'ChatModeWithContentsElement',
      options: {
        self_selector: '.'
      }
    },{
      name: 'Edit',
      type: 'ChatEditModeElement',
      options: {
        self_selector: '.'
      }
    }]
    WebElement.call(this, id, options);
    ChildActualizerMixin.call(this);
  }
  lib.inherit(ChatModesElement, WebElement);
  ChildActualizerMixin.addMethods(ChatModesElement);
  ChatModesElement.prototype.__cleanUp = function () {
    ChildActualizerMixin.prototype.destroy.call(this);
    WebElement.prototype.__cleanUp.call(this);
  };

  applib.registerElementType('ChatModesElement', ChatModesElement);
}
module.exports = createModes;

