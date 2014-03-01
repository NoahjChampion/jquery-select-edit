!function ($) {
    'use strict';

    var _NAME_ = 'selectEdit',
        _Constructor,
        KEY_CODE_ESCAPE = 27,
        KEY_CODE_UP = 38,
        KEY_CODE_DOWN = 40,
        KEY_CODE_LEFT = 39,
        KEY_CODE_RIGHT = 37,
        KEY_CODE_ENTER = 13,
        $document = $(document),
        CLASS = 'select-edit',
        CLASS_BUTTON = CLASS + '__select',
        CLASS_BUTTON_OPEN = CLASS_BUTTON + '_open',
        CLASS_BUTTON_EMPTY = CLASS_BUTTON + '_empty',
        CLASS_BUTTON_TEXT = CLASS_BUTTON + '__current',
        CLASS_DROP = CLASS + '-drop',
        CLASS_DROP_SHOW = CLASS_DROP + '_show',
        CLASS_TOOLTIP = CLASS + '__tooltip',
        CLASS_LIST = CLASS + '__results',
        CLASS_LISTBOX = CLASS_LIST,
        CLASS_LIST_ITEM = CLASS_LIST + '__item',
        CLASS_LIST_ITEM_HOVER = CLASS_LIST_ITEM + '_hover',
        CLASS_LIST_ITEM_SELECTED = CLASS_LIST_ITEM + '_selected',
        _toString = Object.prototype.toString,
        _isFunction = function (object) {
            return typeof object === 'function';
        },
        _isString = function (object) {
            return _toString.call(object) == "[object String]";
        },
        _isArray = function (object) {
            return _toString.call(object) == "[object Array]";
        };

    _Constructor = function (element, options) {
        this.$select = $(element);
        this.options = options;

        if (!this.$select.is('select')) {
            console.warn(_NAME_, 'Sorry, only select element!');
            return false;
        }

        this.$select.attr('autocomplete', 'off');
        this.isMultiple = this.$select.prop('multiple');

        this.initialize();
    };

    _Constructor.DEFAULTS = {
        tmplContent:
            '<div role="form">' +
                '<span role="button">' +
                    '<span role="link"></span>' +
                '</span>' +
            '</div>',
        tmplGroup: '<div role="group"></div>',
        tmplTooltip: '<div role="tooltip"></div>',
        tmplList: '<div role="list"></div>',
        tmplListbox: '<div role="listbox"></div>',
        tmplListitem: '<div role="listitem"></div>',

        offsetTop: 3,

        classHide: CLASS + '-hide',
        classForm: CLASS,
        classButton: CLASS_BUTTON,
        classButtonOpen: CLASS_BUTTON_OPEN,
        classButtonEmpty: CLASS_BUTTON_EMPTY,
        classButtonText: CLASS_BUTTON_TEXT,
        classGroup: CLASS_DROP,
        classGroupShow: CLASS_DROP_SHOW,
        classTooltip: CLASS_TOOLTIP,
        classList: CLASS_LIST,
        classListbox: CLASS_LISTBOX,
        classListitem: CLASS_LIST_ITEM,
        classListitemHover: CLASS_LIST_ITEM_HOVER,
        classListitemSelected: CLASS_LIST_ITEM_SELECTED
    };

    _Constructor.prototype = {
        Constructor: _Constructor,

        isOpen: false,
        isGenerateItems: false,

        /**
         * Инициализация
         */
        initialize: function () {
            var options = this.options;
            this._initHtml();
            this._hideSelect();

            this.$select
                // прячем из фокуса селект
                .attr('tabindex', '-1')
                .on('change', $.proxy(this._onChangeSelect, this));

            // создаем фейковый инпут для фокуса
            this.$fakeInput =$('<input tabindex="0">')
                .addClass(options.classHide)
                .on('focus keydown blur', $.proxy(this._onEventFake, this))
                .insertBefore(this.$select);

            this._actualizeButtonText();

            this.$content.insertAfter(this.$select);

            this.$button.on('click.' + _NAME_ + ' touchstart.' + _NAME_, $.proxy(this.toggle, this));
        },

        /**
         * События фейкового инпута
         * @param e
         * @private
         */
        _onEventFake: function (e) {
            switch (e.type) {
                case 'focus':
                    this.show();
                    break;

                case 'blur':
                    break;
            }
        },

        /**
         * Событие на смену данных в селекте
         * @private
         */
        _onChangeSelect: function () {
            this._actualizeListItems();
            this._actualizeButtonText();
        },

        /**
         * Актуализировать каскомный список
         * @private
         */
        _actualizeListItems: function () {
            var classSelected = this.options.classListitemSelected;
            
            this.getListItems().removeClass(classSelected);
            this.getSelected().addClass(classSelected);
//            console.log('_actualizeListItems', this.$select.val());
        },

        /**
         * Актуализация кнопки кастомного селекта
         * @private
         */
        _actualizeButtonText: function () {
            var text = this._getSelectedText();
            this.$buttonText.text(text || this.$select.attr('placeholder'));

            this.$button.toggleClass(this.options.classButtonEmpty, !text)
        },

        /**
         * Показать/спрятать список
         */
        toggle: function () {
            if (this.isOpen) {
                this.hide();
            }
            else {
                this.show();
            }
            return false;
        },

        /**
         * Показать список
         * @returns {boolean}
         */
        show: function () {
            if (this.isOpen) {
                return true;
            }

            var position = this.$content.position();

            // оповестить открытые списки
            $document.trigger('event-show.' + _NAME_);

            position.top += this.$content.outerHeight() + this.options.offsetTop;

            this._generateItems();
            this.$group
                .offset(position)
                .addClass(this.options.classGroupShow)
                .appendTo(document.body)
                .focus();

            this.isOpen = true;
            this._eventsGroup();
        },

        /**
         * Спрятать список
         * @returns {boolean}
         */
        hide: function () {
            this.$group
                .removeClass(this.options.classGroupShow)
                .offset({
                    top: 0,
                    left: 0
                }).detach();
            this.isOpen = false;
            this._eventsGroup();
        },

        /**
         * Навесить/снять события списка
         * @private
         */
        _eventsGroup: function () {
            var options = this.options;

            if (this.isOpen) {
                this.$group
                    .on('click.' + _NAME_ + ' touchstart.' + _NAME_, $.proxy(this._clickGroup, this))
                    .on('click.' + _NAME_ + ' touchstart.' + _NAME_, '.' + options.classListitem, $.proxy(this._clickListItem, this))
                    .on('mouseover.' + _NAME_ +' mouseout.' + _NAME_ + ' touchstart.' + _NAME_,
                        '.' + options.classListitem,
                        $.proxy(this._hoverItem, this)
                    );
                $document
                    .on('keydown.' + _NAME_, $.proxy(this._keydownGroup, this))
                    .on('click.' + _NAME_ + ' touchstart.' + _NAME_, $.proxy(this._clickDocument, this))
                    .on('event-show.' + _NAME_, $.proxy(this.hide, this));
            }
            else {
                this.$group.off('.' + _NAME_);
                $document.off('.' + _NAME_);
            }
            this.toggleButton();
        },

        /**
         * Состояние кнопки
         */
        toggleButton: function () {
            this.$button.toggleClass(this.options.classButtonOpen, this.isOpen);
        },

        /**
         * Отлов событий ввода
         * @param e
         * @returns {boolean}
         * @private
         */
        _keydownGroup: function (e) {
            if (!this.isOpen) {
                return true;
            }

            switch (e.which) {
                case KEY_CODE_DOWN:
                case KEY_CODE_UP:
                    this._navGroupItem(e.which === KEY_CODE_DOWN);
                    return false;
                    break;
                case KEY_CODE_LEFT:
                case KEY_CODE_RIGHT:
                    this._navGroupItem(e.which === KEY_CODE_LEFT);
                    return false;
                    break;
                case KEY_CODE_ESCAPE:
                    this.hide();
                    break;
                case KEY_CODE_ENTER:
                    this._toggleListItemHover();
                    break;
            }
        },

        /**
         * Навигация по списку - вверх/вниз
         * @param next
         * @private
         */
        _navGroupItem: function (next) {
            var options = this.options,
                classHover = options.classListitemHover,
                $items = this.getListItems(),
                $itemHover = this._getListItemsHover($items),
                $current;

            if (next) {
                $current = ($itemHover.length && $itemHover.next());
                $current = ($current.length && $current) || $items.first();
            }
            else {
                $current = ($itemHover.length && $itemHover.prev());
                $current = ($current.length && $current) || $items.last();
            }

            $itemHover.removeClass(classHover);
            $current.addClass(classHover);
        },

        /**
         * Клик по списку.
         * Обязательно должен возвращать false, чтобы не закрылся.
         *
         * @param e
         * @returns {boolean}
         * @private
         */
        _clickGroup: function (e) {
            return false;
        },

        /**
         * Клик по документу.
         * Отловить закрытие списка.
         *
         * @private
         */
        _clickDocument: function () {
            this.hide();
        },

        /**
         * Отметить/снять текущий подсвеченный элемент списка
         * @private
         */
        _toggleListItemHover: function () {
            var $currentItem = this._getListItemsHover();
            if (!$currentItem.length) {
                return;
            }
            this._switchListItem($currentItem, !$currentItem.hasClass(this.options.classListitemSelected));
        },

        /**
         * Подсветить элемент списка или наоборот
         * @param e
         * @private
         */
        _hoverItem: function (e) {
            var $listItems = this.getListItems(),
                classHover = this.options.classListitemHover,
                $listItem = $(e.currentTarget);

            switch (e.type) {
                case 'mouseover':
                case 'touchstart':
                    e.type === 'touchstart' && $listItems.removeClass(classHover);
                    $listItem.addClass(classHover);
                    break;

                case 'mouseout':
                    $listItems.removeClass(classHover);
                    break;
            }
        },

        /**
         * Клик по элементу списка
         * @param e
         * @private
         */
        _clickListItem: function (e) {
            var options = this.options,
                classSelected = options.classListitemSelected,
                $item = $(e.currentTarget),
                isSelected = !$item.hasClass(classSelected);

            !this.isMultiple && this.getListItems().removeClass(classSelected);

            this._switchListItem($item, isSelected)
//            this._switchOption($item.data('value'), isSelected);
        },

        /**
         * Переключить состояние элемента списка
         * @param $item
         * @param selected
         * @private
         */
        _switchListItem: function ($item, selected) {
            $item.toggleClass(this.options.classListitemSelected, selected);
            this._switchOption($item.data('value'), selected);
            this._actualizeButtonText();
        },

        /**
         * Переключить состояние у селекта
         * @param value
         * @param selected
         * @private
         */
        _switchOption: function (value, selected) {
            var $option = this.$select.find('option[value="' + value + '"]');
            selected && $option.attr('selected','selected');
            !selected && $option.removeAttr('selected');
        },

        /**
         * Достать все элементы списка
         * @returns {*|HTMLElement|$listItems}
         */
        getListItems: function () {
            return this.$listItems || $();
        },

        /**
         * Достать подсвеченные элементы списка
         * @param $items
         * @returns {Array|*|Object}
         * @private
         */
        _getListItemsHover: function ($items) {
            $items = $items || this.getListItems();
            return $items.filter('.' + this.options.classListitemHover);
        },

        /**
         * Достать список всех выделенных элементов.
         * Возвращается строка через запятую.
         *
         * @returns {string}
         * @private
         */
        _getSelectedText: function () {
            var text = '';
            this.getSelected().each(function () {
                text += (text ? ', ' : '') + $(this).text();
            });
            return text;
        },

        /**
         * Достать список всех выделенных элементов.
         * @returns {*|HTMLElement}
         */
        getSelected: function () {
            var val = this.$select.val(),
                $items = $();

            if (_isString(val)) {
                $items = this.$select.find('[value="' + val + '"]');
            }
            else if (_isArray(val)) {
                var $itemsAll = this.$select.find('[value]');
                val.forEach(function (value) {
                    var $item = $itemsAll.filter('[value="' + value + '"]');
                    $items = ($items && $items.add($item)) || $item;
                });
            }
            return $items;
        },

        /**
         * Скрыть родной селект
         * @private
         */
        _hideSelect: function () {
            this.$select.addClass(this.options.classHide);
        },

        /**
         * Инициализация html
         * @private
         */
        _initHtml: function () {
            var options = this.options;
            this.$content = $(options.tmplContent).addClass(options.classForm);
            this.$button = this.$content
                .find('[role=button]')
                .addClass(options.classButton);

            this.$buttonText = this.$content
                .find('[role=link]')
                .addClass(options.classButtonText);
            this.$group = $(options.tmplGroup).addClass(options.classGroup);

            if (this.isMultiple) {
                this.$list = $(options.tmplListbox).addClass(options.classListbox);
            }
            else {
                this.$list = $(options.tmplList).addClass(options.classList);
            }

            this.$listItem = $(options.tmplListitem).addClass(options.classListitem);
            this.$listItems = $();

            if (this.options.tooltip) {
                this.$tooltip = $(options.tmplTooltip)
                    .addClass(options.classTooltip)
                    .html(this.options.tooltip);
                this.$group.append(this.$tooltip);
            }

            this.$group.append(this.$list);
        },

        /**
         * Генерация элементов списка
         * @returns {boolean}
         * @private
         */
        _generateItems: function () {
            var options = this.options,
                $options = $(),
                $item = this.$listItem;

            if (this.isGenerateItems) {
                return true;
            }

            this.$select.contents().each(function () {
                var $this = $(this),
                    $option;

                if ($this.is('option')) {
                    $option = $item
                        .clone()
                        .attr('data-value', $this.val())
                        .text($this.text());

                    $this.is(':selected') && $option.addClass(options.classListitemSelected);
                    $options = $options.add($option);
                }
            });

            this.$listItems = $options;
            this.$list.html($options);
        }
    };

    $.fn[_NAME_] = function (option) {
        return this.each(function () {
            var $this = $(this),
                data = $this.data(),
                ctor = $this.data(_NAME_),
                options = $.extend({}, _Constructor.DEFAULTS, data, typeof option == 'object' && option);

            if (!ctor) {
                $this.data(_NAME_, (ctor = new _Constructor(this, options)))
            }

            if (typeof option == 'string' && _isFunction(ctor[option])) {
                if (option.charAt(0) !== '_') {
                    ctor[option]()
                }
                else {
                    console.warn(_NAME_, 'Do not use private methods!');
                }
            }
        })
    };

    $.fn[_NAME_].Constructor = _Constructor;

    // polyfills
    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function (fn, scope) {
            for (var i = 0, len = this.length; i < len; ++i) {
                fn.call(scope, this[i], i, this);
            }
        }
    }

}(jQuery);