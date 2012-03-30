(function(jQuery, undefined) {
    
    jQuery.widget('Midgard.midgardCreate', {
        options: {
            statechange: function() {},
            toolbar: 'full',
            saveButton: null,
            state: 'browse',
            highlight: true,
            highlightColor: '#67cc08',
            editor: 'hallo',
            editorOptions: {},
            enableEditor: null,
            disableEditor: null,
            url: function() {},
            storagePrefix: 'node',            
            workflows: {
                url: null
            },
            notifications: {},
            vie: null
        },
    
        _create: function() {
            if (this.options.vie) {
              this.vie = this.options.vie;
            } else {
              this.vie = new VIE({classic: true});
            }
            this._checkSession();
            this._enableToolbar();
            this._saveButton();
            this._editButton();
            this.element.midgardStorage({vie: this.vie, url: this.options.url});          
            
            if (this.element.midgardWorkflows) {
                this.element.midgardWorkflows(this.options.workflows);
            }
            
            if (this.element.midgardNotifications) {
                this.element.midgardNotifications(this.options.notifications);
            }
        },
        
        _init: function() {
            if (this.options.state === 'edit') {
                this._enableEdit();
            } else {
                this._disableEdit();
            }
            
            // jQuery(this.element).data('midgardNotifications').showTutorial();            
        },
        
        showNotification: function(options) {
            if (this.element.midgardNotifications) {
                jQuery(this.element).data('midgardNotifications').create(options);
            }
        },
        
        _checkSession: function() {
            if (!Modernizr.sessionstorage) {
                return;
            }
            
            var toolbarID = this.options.storagePrefix + 'Midgard.create.toolbar';
            if (sessionStorage.getItem(toolbarID)) {
                this._setOption('toolbar', sessionStorage.getItem(toolbarID));
            }
            
            var stateID = this.options.storagePrefix + 'Midgard.create.state';
            if (sessionStorage.getItem(stateID)) {
                this._setOption('state', sessionStorage.getItem(stateID));
            }
           
            this.element.bind('midgardcreatestatechange', function(event, options) {
                sessionStorage.setItem(stateID, options.state);
            });
        },
        
        _saveButton: function() {
            if (this.options.saveButton) {
                return this.options.saveButton;
            }
            
            jQuery('#midgard-bar .toolbarcontent-right', this.element).append(jQuery('<button id="midgardcreate-save">Save</button>'));
            this.options.saveButton = jQuery('#midgardcreate-save', this.element);
            this.options.saveButton.button({disabled: true});
            return this.options.saveButton;
        },
        
        _editButton: function() {
            var widget = this;
            jQuery('#midgard-bar .toolbarcontent-right', this.element).append(jQuery('<input type="checkbox" id="midgardcreate-edit" /><label for="midgardcreate-edit">Edit</label>'));
            var editButton = jQuery('#midgardcreate-edit', this.element).button();
            if (this.options.state === 'edit') {
                editButton.attr('checked', true);
                editButton.button('refresh');
            }
            editButton.bind('change', function() {
                if (widget.options.state === 'edit') {
                  //editButton.attr('checked', false);
                  widget._disableEdit();
                  return;
                }
                widget._enableEdit();
            });
        },
        
        _enableToolbar: function() {
            var widget = this;
            this.element.bind('midgardtoolbarstatechange', function(event, options) {
                if (Modernizr.sessionstorage) {
                    sessionStorage.setItem(widget.options.storagePrefix + 'Midgard.create.toolbar', options.display);
                }
                widget._setOption('toolbar', options.display);
            });

            this.element.midgardToolbar({display: this.options.toolbar, vie: this.vie});
        },
        
        _enableEdit: function() {
            this._setOption('state', 'edit');
            var widget = this;
            var editableOptions = {
                disabled: false,
                vie: widget.vie,
                editor: widget.options.editor,
                editorOptions: widget.options.editorOptions,
            };
            if (widget.options.enableEditor) {
                editableOptions[enableEditor] = widget.options.enableEditor;
            }
            if (widget.options.disableEditor) {
                editableOptions[disableEditor] = widget.options.disableEditor;
            }

            jQuery('[about]', this.element).each(function() {
                var element = this;
                if (widget.options.highlight) {
                    var highlightEditable = function(event, options) {
                        if (options.entityElement.get(0) !== element) {
                            // Propagated event from another entity, ignore
                            return;
                        }

                        // Highlight the editable
                        options.element.effect('highlight', {color: widget.options.highlightColor}, 3000);
                    };
                
                    jQuery(this).bind('midgardeditableenableproperty', highlightEditable);
                }
                jQuery(this).bind('midgardeditabledisable', function() {
                    jQuery(this).unbind('midgardeditableenableproperty', highlightEditable);
                });

                jQuery(this).midgardEditable(editableOptions);
            });
            this._trigger('statechange', null, {state: 'edit'});
        },
        
        _disableEdit: function() {
            var widget = this;
            var editableOptions = {
                disabled: true,
                vie: widget.vie,
                editor: widget.options.editor,
                editorOptions: widget.options.editorOptions,
            };
            if (widget.options.enableEditor) {
                editableOptions[enableEditor] = widget.options.enableEditor;
            }
            if (widget.options.disableEditor) {
                editableOptions[disableEditor] = widget.options.disableEditor;
            }
            jQuery('[about]', this.element).each(function() {
                jQuery(this).midgardEditable(editableOptions).removeClass('ui-state-disabled');
            });
            this._setOption('state', 'browse');
            this._trigger('statechange', null, {state: 'browse'});
        }
    });
})(jQuery);
(function(jQuery, undefined) {
    jQuery.widget('Midgard.midgardEditable', {
        options: {
            editables: [],
            model: null,
            editorOptions:{},
            // the available widgets by data type
            // TODO: needs a comprehensive list of types and their appropriate widgets
            widgets: {
              	'Text': 'halloWidget',
              	'default': 'halloWidget'
            },
            // returns the name of the widget to use for the given property
            widgetName: function(data) {
              	// TODO: make sure type is already loaded into VIE
              	var propertyType = 'default';
              	var type=this.model.get('@type');
              	if (type){
                		if (type.attributes && type.attributes.get(data.property)){
                			  propertyType=type.attributes.get(data.property).range[0];
                		}
              	}
              	if (this.widgets[propertyType]){
              		  return this.widgets[propertyType];
              	}
              	return this.widgets['default'];
            },
            enableEditor: function(data) {
              	var widgetName = this.widgetName(data);
                data.disabled = false;
                if (typeof jQuery(data.element)[widgetName] !== 'function') {
                  throw new Error(widgetName + ' widget is not available');
                }
              	jQuery(data.element)[widgetName](data);
              	jQuery(data.element).data('createWidgetName', widgetName);
              	return jQuery(data.element);
            },
            disableEditor: function(data) {
              	var widgetName = jQuery(data.element).data('createWidgetName');
                data.disabled = true;
              	if (widgetName) {
                	    // only if there has been an editing widget registered
                    	jQuery(data.element)[widgetName](data);
                      jQuery(data.element).removeClass('ui-state-disabled');
                }
            },
            addButton: null,
            enable: function() {},
            enableproperty: function() {},
            disable: function() {},
            activated: function() {},
            deactivated: function() {},
            changed: function() {},
            vie: null
        },
    
        _create: function() {
            this.vie = this.options.vie;
            if (!this.options.model) {
                var models = this.vie.RDFaEntities.getInstances(this.element);
                this.options.model = models[0];
            }
        },
        
        _init: function() {
            if (this.options.disabled) {
                this.disable();
                return;
            }
            this.enable();
        },
        
        enable: function() {  
            var widget = this;
            this.vie.RDFa.findPredicateElements(this.options.model.id, jQuery('[property]', this.element), false).each(function() {
                return widget._enableProperty(jQuery(this));
            });
            this._trigger('enable', null, {
                instance: this.options.model,
                entityElement: this.element
            });
            _.forEach(this.vie.services.rdfa.views, function(view) {
                if (view instanceof widget.vie.view.Collection) {
                    widget._enableCollection(view);
                }
            });
        },
        
        disable: function() {
            var widget = this;
            jQuery.each(this.options.editables, function(index, editable) {
                widget.options.disableEditor({
                    widget: widget,
                    editable: editable,
                    entity: widget.options.model,
                    element: jQuery(this)
                });
            });
            this.options.editables = [];
            
            if (this.options.addButton) {
                this.options.addButton.remove();
                delete this.options.addButton;
            }

            this._trigger('disable', null, {
                instance: this.options.model,
                entityElement: this.element
            });
        },
        
        _enableProperty: function(element) {
            var widget = this;
            var propertyName = this.vie.RDFa.getPredicate(element);
            if (!propertyName) {
                return true;
            }
            if (this.options.model.get(propertyName) instanceof Array) {
                // For now we don't deal with multivalued properties in the editable
                return true;
            }
            
            

            var editable = this.options.enableEditor({
                widget: this,
                element: element,
                entity: this.options.model,
                property: propertyName,
                editorOptions: this.options.editorOptions,
                modified: function(content) {
                    var changedProperties = {};
                    changedProperties[propertyName] = content;
                    widget.options.model.set(changedProperties, {silent: true});
                    widget._trigger('changed', null, {
                        property: propertyName,
                        instance: widget.options.model,
                        element: element,
                        entityElement: widget.element
                    });
                },
                activated: function() {
                    widget._trigger('activated', null, {
                        property: propertyName,
                        instance: widget.options.model,
                        element: element,
                        entityElement: widget.element
                    });
                },
                deactivated: function() {
                    widget._trigger('deactivated', null, {
                        property: propertyName,
                        instance: widget.options.model,
                        element: element,
                        entityElement: widget.element
                    });
                } 
            });

            this._trigger('enableproperty', null, {
                editable: editable,
                property: propertyName,
                instance: this.options.model,
                element: element,
                entityElement: this.element
            });

            this.options.editables.push(editable);
        },

        _enableCollection: function(collectionView) {
            var widget = this;

            if (!collectionView.owner || collectionView.owner.getSubject() !== widget.options.model.getSubject()) {
                return;
            }

            if (widget.options.addButton) {
                return;
            }

            if (collectionView.template.length === 0) {
                // Collection view has no template and so can't add
                return;
            }

            collectionView.collection.url = widget.options.model.url();

            collectionView.bind('add', function(itemView) {
                //itemView.el.effect('slide');
                itemView.model.primaryCollection = collectionView.collection;
                itemView.el.midgardEditable({disabled: widget.options.disabled, model: itemView.model, vie: widget.vie, editor: widget.options.editor});
            });

            collectionView.collection.bind('add', function(model) {
                widget.vie.entities.add(model);
                model.collection = collectionView.collection;
            });
            
            collectionView.bind('remove', function(itemView) {
                //itemView.el.hide('drop');
            });
            
            widget.options.addButton = jQuery('<button>Add</button>').button();
            widget.options.addButton.addClass('midgard-create-add');
            widget.options.addButton.click(function() {
                collectionView.collection.add({});
            });
            
            collectionView.el.after(widget.options.addButton);
        }
    });
})(jQuery);
/**
 * Extend this base for any editing widget.
 */
(function (jQuery, undefined) {
  jQuery.widget('Create.editWidget', {
    options: {
      disabled: false
    },
    // override to enable the widget
    enable: function () {
      this.element.attr('contenteditable', 'true');
    },
    // override to disable the widget
    disable: function (disable) {
      this.element.attr('contenteditable', 'false');
    },
    // called by the jquery ui plugin factory when creating the widget
    _create: function () {
      this._registerWidget();
      this._initialize();
    },
    _init: function () {
      if (this.options.disabled) {
        this.disable();
        return;
      }
      this.enable();
    },
    // override this function to initialize the widget functions
    _initialize: function () {
      var self = this;
      var before = this.element.html();
      this.element.bind('blur keyup paste', function (event) {
        console.log("checking for modifications");
        if (self.options.disabled) {
          console.log("widget is disabled");
          return;
        }
        var current = jQuery(this).html();
        if (before !== current) {
          console.log("element content has been modified");
          before = current;
          self.options.modified(current);
        }
      });
    },
    // used to register the widget name with the DOM element
    _registerWidget: function () {
      this.element.data("createWidgetName", this.widgetName);
    }
  });
})(jQuery);
(function (jQuery, undefined) {
  jQuery.widget('Create.alohaWidget', jQuery.Create.editWidget, {
    enable: function () {
      this._initialize();
      this.options.disabled = false;
    },
    disable: function () {
      try {
        options.editable.destroy();
      } catch (err) {}
      this.options.disabled = true;
    },
    _initialize: function () {
      var options = this.options;
      var editable = new Aloha.Editable(Aloha.jQuery(options.element.get(0)));
      editable.vieEntity = options.entity;

      // Subscribe to activation and deactivation events
      Aloha.bind('aloha-editable-activated', function () {
        options.activated();
      });
      Aloha.bind('aloha-editable-deactivated', function () {
        options.deactivated();
      });

      Aloha.bind('aloha-smart-content-changed', function () {
        if (!editable.isModified()) {
          return true;
        }
        options.modified(editable.getContents());
        editable.setUnmodified();
      });
    }
  });
})(jQuery);
(function (jQuery, undefined) {
  jQuery.widget('Create.halloWidget', jQuery.Create.editWidget, {
    enable: function () {
      jQuery(this.element).hallo({
        editable: true
      });
      this.options.disabled = false;
    },
    disable: function () {
      jQuery(this.element).hallo({
        editable: false
      });
      this.options.disabled = true;
    },
    _initialize: function () {
      var defaultOptions = {
        plugins: {
          halloformat: {}
        },
        editable: true,
        placeholder: '[' + this.options.property + ']'
      };
      var editorOptions = {};
      if (this.options.editorOptions[this.options.property]) {
        editorOptions = this.options.editorOptions[this.options.property];
      } else if (this.options.editorOptions['default']) {
        editorOptions = this.options.editorOptions['default'];
      }
      jQuery.extend(defaultOptions, editorOptions);
      jQuery(this.element).hallo(defaultOptions);
      var self = this;
      jQuery(this.element).bind('halloactivated', function (event, data) {
        self.options.activated();
      });
      jQuery(this.element).bind('hallodeactivated', function (event, data) {
        self.options.deactivated();
      });
      jQuery(this.element).bind('hallomodified', function (event, data) {
        self.options.modified(data.content);
        data.editable.setUnmodified();
      });
    }
  });
})(jQuery);
/*
// jQuery(this.element).data('midgardNotifications').create({body: 'Content here!'});
// jQuery(this.element).data('midgardNotifications').create({
//     body: "Do you wan't to run tests now?",
//     actions: [
//         {
//             name: 'runtests', label: 'Run tests',
//             cb: function(e, notification) {
//                 alert('Running tests');
//                 notification.close();
//             }
//         },
//         {
//             name: 'cancel', label: 'Cancel',
//             cb: function(e, notification) {
//                 notification.close();
//             }
//         }
//     ]
// });
 */
(function(jQuery, undefined) {
    var _midgardnotifications_active = [];
    var MidgardNotification = function(parent, options) {
        var _defaults = {
            class_prefix: 'midgardNotifications',
            timeout: 3000, // Set to 0 for sticky
            auto_show: true,
            body: '',
            bindTo: null,
            gravity: 'T',
            effects: {
                onShow: function(item, cb) {item.animate({opacity: 'show'}, 600, cb)},
                onHide: function(item, cb) {item.animate({opacity: 'hide'}, 600, cb)}
            },
            actions: [],
            callbacks: {}
	  	};
	 	var _config = {};
	 	var _classes = {};
	 	var _item = null;
	 	var _id = null;
	 	var _bind_target = null;
	 	
	 	var _parent = parent;
	 	
	 	var _story = null;
	 	
	 	var base = {
	 	    constructor: function(options) {
	 	        _config = $.extend(_defaults, options || {});
	 	        
	 	        _classes = {
                    container: _config.class_prefix + '-container',
                    item: {
                        wrapper: _config.class_prefix + '-item',
                        arrow: _config.class_prefix + '-arrow',
                        disregard: _config.class_prefix + '-disregard',
                        content: _config.class_prefix + '-content',
                        actions: _config.class_prefix + '-actions',
                        action: _config.class_prefix + '-action'
                    }
                };
                
                this._generate();
	 	    },
	 	    getId: function() {
	 	        return _id;
	 	    },
	 	    getElement: function() {
	 	        return _item;
	 	    },
	 	    _generate: function() {
	 	        var _self = this;
	 	        var outer, inner, content = null;
	 	        
                _item = outer = jQuery('<div class="'+_classes.item.wrapper+'-outer"/>');
                outer.css({
                    display: 'none'
                });
                inner = jQuery('<div class="'+_classes.item.wrapper+'-inner"/>');
                inner.appendTo(outer);
                
                if (_config.bindTo) {
                    outer.addClass(_classes.item.wrapper + '-binded');
                    
                    var arrow = jQuery('<div class="'+_classes.item.arrow+'"/>');
                    arrow.appendTo(outer);
                } else {
                    outer.addClass(_classes.item.wrapper + '-normal');
                }
	 	        
	 	        var content = jQuery('<div class="'+_classes.item.content+'"/>');
	 	        content.html(_config.body);
	 	        content.appendTo(inner);
	 	        
	 	        if (_config.actions.length) {
                    var actions_holder = jQuery('<div class="'+_classes.item.actions+'"/>');
                    actions_holder.appendTo(inner);                    
                    jQuery.each(_config.actions, function(i, opts) {
                        var action = jQuery('<button name="'+opts.name+'" class="button-'+opts.name+'">'+opts.label+'</button>').button();
                        action.bind('click', function(e) {
                            if (_story) {
                                opts.cb(e, _story, _self);
                            } else {
                                opts.cb(e, _self);
                            }
                            
                        });
                        actions_holder.append(action);
                    });
                }
	 	        
	 	        _item.bind('click', function(e) {
	 	            if (_config.callbacks.onClick) {
    	 	            _config.callbacks.onClick(e, _self);
    	 	        } else {
    	 	            if (!_story) {
    	 	                _self.close();
    	 	            }    	 	            
    	 	        }
	 	        });	 	        
	 	        
	 	        if (_config.auto_show) {
	 	            this.show();
	 	        }
	 	        
	 	        this._setPosition();
	 	        
	 	        _id = _midgardnotifications_active.push(this);
	 	        
	 	        _parent.append(_item);
	 	    },
            _setPosition: function() {
                if (_config.bindTo) {
                    _bind_target = jQuery(_config.bindTo);
                    var trgt_w = _bind_target.outerWidth();
					var trgt_h = _bind_target.outerHeight();
					var trgt_l = _bind_target.offset().left;
					var trgt_t = _bind_target.offset().top;
					
					switch (_config.gravity) {
						case 'TL':
							properties = {
								'left'	: trgt_l,
								'top'	: trgt_t + trgt_h + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_TL');
							break;
						case 'TR'	:
							properties = {
								'left'	: trgt_l + trgt_w - _item.width() + 'px',
								'top'	: trgt_t + trgt_h + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_TR');
							break;
						case 'BL'	:
							properties = {
								'left'	: trgt_l + 'px',
								'top'	: trgt_t - _item.height() + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_BL');
							break;
						case 'BR'	:
							properties = {
								'left'	: trgt_l + trgt_w - _item.width() + 'px',
								'top'	: trgt_t - _item.height() + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_BR');
							break;
						case 'LT'	:
							properties = {
								'left'	: trgt_l + trgt_w + 'px',
								'top'	: trgt_t + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_LT');
							break;
						case 'LB'	:
							properties = {
								'left'	: trgt_l + trgt_w + 'px',
								'top'	: trgt_t + trgt_h - _item.height() + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_LB');
							break;
						case 'RT'	:
							properties = {
								'left'	: trgt_l - _item.width() + 'px',
								'top'	: trgt_t + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_RT');
							break;
						case 'RB'	:
							properties = {
								'left'	: trgt_l - _item.width() + 'px',
								'top'	: trgt_t + trgt_h - _item.height() + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_RB');
							break;
						case 'T'	:
							properties = {
								'left'	: trgt_l + trgt_w/2 - _item.width()/2 + 'px',
								'top'	: trgt_t + trgt_h + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_T');
							break;
						case 'R'	:
							properties = {
								'left'	: trgt_l - _item.width() + 'px',
								'top'	: trgt_t + trgt_h/2 - _item.height()/2 + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_R');
							break;
						case 'B'	:
							properties = {
								'left'	: trgt_l + trgt_w/2 - _item.width()/2 + 'px',
								'top'	: trgt_t - _item.height() + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_B');
							break;
						case 'L'	:
							properties = {
								'left'	: trgt_l + trgt_w  + 'px',
								'top'	: trgt_t + trgt_h/2 - _item.height()/2 + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_L');
							break;
					}
					
					properties.position = 'absolute';
					_item.css(properties);
					
                    return;
                }
                
                if (!_config.position) {
                    _config.position = 'top right';
                }

                var marginTop = jQuery('.midgard-create').height();
                
                pos = {
                    position: 'fixed'
                };
                
                var activeHeight = function(items) {
                    var total_height = 0;
                    jQuery.each(items, function(i, item) {
                        if (!item) {
                            return;
                        }
                        total_height += item.getElement().height();
                    });
                    return total_height;
                }
                
                if (_config.position.match(/top/)) {
                    pos.top = marginTop + activeHeight(_midgardnotifications_active) + 'px';
                }
                if (_config.position.match(/bottom/)) {
                    pos.bottom = (_midgardnotifications_active.length-1 * item.height()) + item.height() + 10 + 'px';
                }
                if (_config.position.match(/right/)) {
                    pos.right = 20 + 'px';
                }
                if (_config.position.match(/left/)) {
                    pos.left = 20 + 'px';
                }

                _item.css(pos);
            },
	 	    show: function() {
	 	        var self = this;
	 	        
	 	        if (_config.callbacks.beforeShow) {
	 	            _config.callbacks.beforeShow(self);
	 	        }
	 	        
	 	        if (_config.bindTo) {
    	 	        var w_t	= jQuery(window).scrollTop();	 	        
    				var w_b = jQuery(window).scrollTop() + jQuery(window).height();				
    				var b_t = parseFloat(_item.offset().top, 10);
    				var e_t = _bind_target.offset().top;
    				var e_h = _bind_target.outerHeight();
			
    				if (e_t < b_t) {
    				    b_t = e_t;
    				}					
			
    				var b_b = parseFloat(_item.offset().top, 10) + _item.height();
    				if ((e_t + e_h) > b_b) {
    				    b_b = e_t + e_h;
    				}
				}
            
                if (_config.timeout > 0 && !_config.actions.length) {
	 	            setTimeout(function() {
	 	                self.close();
	 	            }, _config.timeout);
	 	        }
                
				if (_config.bindTo && (b_t < w_t || b_t > w_b) || (b_b < w_t || b_b > w_b)) {
					jQuery('html, body').stop()
					.animate({scrollTop: b_t}, 500, 'easeInOutExpo', function() {
						_config.effects.onShow(_item, function() {
        	 	            if (_config.callbacks.afterShow) {
            	 	            _config.callbacks.afterShow(self);
            	 	        }
        	 	        });
					});
				} else {
				    _config.effects.onShow(_item, function() {
    	 	            if (_config.callbacks.afterShow) {
        	 	            _config.callbacks.afterShow(self);
        	 	        }
    	 	        });
				}
	 	    },
	 	    close: function() {
	 	        var self = this;
	 	        if (_config.callbacks.beforeClose) {
	 	            _config.callbacks.beforeClose(self);
	 	        }	 	        
	 	        _config.effects.onHide(_item, function() {
    	 	        if (_config.callbacks.afterClose) {
    	 	            _config.callbacks.afterClose(self);
    	 	        }
    	 	        self.destroy();
	 	        });
	 	    },
	 	    destroy: function() {
	 	        var self = this;
                jQuery.each(_midgardnotifications_active, function(i,item) {
                    if (item) {
                        if (item.getId() == self.getId()) {
                            delete _midgardnotifications_active[i];
                        }
                    }
                });
	 	        jQuery(_item).remove();
	 	    },
	 	    setStory: function(story) {
	 	        _story = story;
	 	    },
	 	    setName: function(name) {
                _item.addClass(_classes.item.wrapper+'-custom-'+name);
                this.name = name;
	 	    }
	 	};
	 	base.constructor(options);
	 	delete base.constructor;
	 	    
 	    return base;
    };
    
    var MidgardNotificationStoryline = function(options, items) {
        var _defaults = {
	  	};
	 	var _config = {};
	 	var _storyline = {};
	 	var _current_notification = {};
	 	var _previous_item_name = null;
	 	var _first_item_name = null;
	 	var _last_item_name = null;
	 	
	 	var base = {
	 	    constructor: function(options) {
	 	        _config = $.extend(_defaults, options || {});
	 	    },
	 	    setStoryline: function(items) {
	 	        var default_structure = {
	 	            content: '',
	 	            actions: [],
	 	            show_actions: true,
	 	            notification: {}, // Notification options to override
	 	            back: null,
	 	            back_label: null,
	 	            forward: null,
	 	            forward_label: null,
	 	            beforeShow: null,
	 	            afterShow: null,
	 	            beforeClose: null,
	 	            afterClose: null
	 	        };
	 	        
	 	        _storyline = {};
	 	        _current_item = null;
	 	        _previous_item_name = null;
        	 	_first_item_name = null;
        	 	_last_item_name = null;
	 	        
	 	        var self = this;
	 	        
	 	        jQuery.each(items, function(name, it) {
	 	            var item = jQuery.extend({}, default_structure, it);
	 	            item.name = name;
	 	            var notification = jQuery.extend({}, default_structure.notification, it.notification || {});
	 	            notification.body =  item.content;
	 	            
	 	            notification.auto_show = false;
	 	            if (item.actions.length) {
	 	                notification.delay = 0;
	 	            }	 	            
	 	            notification.callbacks = {
	 	                beforeShow: function(notif) {
    	 	                if (item.beforeShow) {
    	 	                    item.beforeShow(notif, self);
    	 	                }
    	 	            },
    	 	            afterShow: function(notif) {
    	 	                if (item.afterShow) {
    	 	                    item.afterShow(notif, self);
    	 	                }
    	 	            },
    	 	            beforeClose: function(notif) {
    	 	                if (item.beforeClose) {
    	 	                    item.beforeClose(notif, self);
    	 	                }
    	 	            },
    	 	            afterClose: function(notif) {
    	 	                if (item.afterClose) {
    	 	                    item.afterClose(notif, self);
    	 	                }
    	 	                _previous_item_name = notif.name;
    	 	            }
	 	            };
	 	            
 	                notification.actions = [];
	 	            
	 	            if (item.show_actions) {
	 	                if (item.back) {
    	 	                back_label = item.back_label;
    	 	                if (!back_label) {
    	 	                    back_label = 'Back';
    	 	                }
    	 	                notification.actions.push({
    	 	                    name: 'back',
    	 	                    label: back_label,
    	 	                    cb: function(e, story, notif) {
                                    story.previous();
                                }
    	 	                });
    	 	            }

    	 	            if (item.forward) {
    	 	                forward_label = item.forward_label;
    	 	                if (!forward_label) {
    	 	                    forward_label = 'Back';
    	 	                }
    	 	                notification.actions.push({
    	 	                    name: 'forward',
    	 	                    label: forward_label,
    	 	                    cb: function(e, story, notif) {
                                    story.next();
                                }
    	 	                });
    	 	            }

    	 	            if (item.actions.length) {
    	 	                jQuery.each(item.actions, function(i, act) {
    	 	                    notification.actions.push(item.actions[i]);
    	 	                });
    	 	            }
	 	            }
	 	            	 	            
	 	            if (!_first_item_name) {
	 	                _first_item_name = name;
	 	            }
	 	            _last_item_name = name;
	 	            
	 	            item.notification = notification;
	 	            
	 	            _storyline[name] = item;
	 	        });
	 	        return _storyline;
	 	    },
	 	    start: function() {
	 	        this._showNotification(_storyline[_first_item_name]);
	 	    },
	 	    stop: function() {
	 	        _current_item.close();
	 	        _current_item = null;
	 	        _previous_item_name = null;
	 	    },
	 	    next: function() {
	 	        _current_item.close();
	 	        if (_storyline[_current_item.name].forward) {
	 	            next_item = _storyline[_current_item.name].forward;
    	 	        this._showNotification(_storyline[next_item]);
	 	        } else {
	 	            this._showNotification(_storyline[_last_item_name]);
	 	        }
	 	    },
	 	    previous: function() {
	 	        if (_previous_item_name) {
	 	            _current_item.close();
	 	            if (_storyline[_current_item.name].back) {
    	 	            prev_item = _storyline[_current_item.name].back;
        	 	        this._showNotification(_storyline[prev_item]);
    	 	        } else {
    	 	            this._showNotification(_storyline[_previous_item_name]);
    	 	        }
	 	        } else {
	 	            this.stop();
	 	        }
	 	    },
	 	    _showNotification: function(item) {
	 	        _current_item = new MidgardNotification(jQuery('body'), item.notification);
	 	        _current_item.setStory(this);
	 	        _current_item.setName(item.name);
	 	        _current_item.show();
	 	        
	 	        return _current_item;
	 	    }
	 	};
	 	base.constructor(options);
	 	delete base.constructor;
	 	if (items) {
	 	    base.setStoryline(items);
	 	}	 	
	 	    
 	    return base;
    };
    
    var _createTutorialStoryline = {
        'start': {
            content: 'Welcome to CreateJS tutorial!',
            forward: 'toolbar_toggle',
            forward_label: 'Start tutorial',
            actions: [
                {
                    name: 'quit',
                    label: 'Quit',
                    cb: function(a, story, notif) {
                        story.stop();
                    }
                }
            ]
        },
        'toolbar_toggle': {
            content: 'This is the CreateJS toolbars toggle button.<br />You can hide and show the full toolbar by clicking here.<br />Try it now.',
            forward: 'edit_button',
            show_actions: false,
            afterShow: function(notification, story) {
                jQuery('body').bind('midgardtoolbarstatechange', function(event, options) {
                    if (options.display == 'full') {
                        story.next();
                        jQuery('body').unbind('midgardtoolbarstatechange');
                    }
                });
            },
            notification: {
                bindTo: '#midgard-bar-hidebutton',
                timeout: 0,
                gravity: 'TL'
            }
        },
        'edit_button': {
            content: 'This is the edit button.<br />Try it now.',
            show_actions: false,
            afterShow: function(notification, story) {
                jQuery('body').bind('midgardcreatestatechange', function(event, options) {
                    if (options.state == 'edit') {
                        story.next();
                        jQuery('body').unbind('midgardcreatestatechange');
                    }
                });                
            },
            notification: {
                bindTo: '.ui-button[for=midgardcreate-edit]',
                timeout: 0,
                gravity: 'TL'
            }
        },
        'end': {
            content: 'Thank you for watching!<br />Happy content editing times await you!'
        }
    };
    
    jQuery.widget('Midgard.midgardNotifications', {
        options: {            
            notification_defaults: {
                class_prefix: 'midgardNotifications',
                position: 'top right'
            }
        },
        
        _create: function() {
            this.classes = {
                container: this.options.notification_defaults.class_prefix + '-container'
            };
            
            if (jQuery('.'+this.classes.container, this.element).length) {
                this.container = jQuery('.'+this.classes.container, this.element);
                this._parseFromDOM();
            } else {
                this.container = jQuery('<div class="'+this.classes.container+'" />');                
                this.element.append(this.container);
            }
        },
        
        destroy: function() {
            this.container.remove();
            $.Widget.prototype.destroy.call(this);
        },
        
        _init: function() {            
        },
        
        _parseFromDOM: function(path) {
            
        },
        
        showStory: function(options, items) {
            var story = new MidgardNotificationStoryline(options, items);
            story.start();
            
            return story;
        },
        
        create: function(options) {
            options = jQuery.extend({}, this.options.notification_defaults, options || {});
            
            item = new MidgardNotification(this.container, options);
 	        item.show();
 	        
 	        return item;
        },
        
        showTutorial: function() {
            this.showStory({}, _createTutorialStoryline);
        }
    });
    
})(jQuery);
(function(jQuery, undefined) {
    jQuery.widget('Midgard.midgardStorage', {
        options: {
            localStorage: false,
            vie: null,
            changedModels: [],
            loaded: function() {},
            url: ''
        },
    
        _create: function() {
            var widget = this;
            
            if (Modernizr.localstorage) {
                this.options.localStorage = true;
            }

            this.vie = this.options.vie;

            this.vie.entities.bind('add', function(model) {
                // Add the back-end URL used by Backbone.sync
                model.url = widget.options.url;
                model.toJSON = model.toJSONLD;
            });
            
            jQuery('#midgardcreate-save').click(function() {
                widget._saveRemote({
                    success: function() {
                        jQuery('#midgardcreate-save').button({disabled: true});
                    },
                    error: function() {
                    }
                });
            });
            
            widget._bindEditables();
        },
        
        _bindEditables: function() {
            var widget = this;

            widget.element.bind('midgardeditablechanged', function(event, options) {
                if (_.indexOf(widget.options.changedModels, options.instance) === -1) {
                    widget.options.changedModels.push(options.instance);
                }
                widget._saveLocal(options.instance);
                jQuery('#midgardcreate-save').button({disabled: false});
            });
            
            widget.element.bind('midgardeditabledisable', function(event, options) {
                widget._restoreLocal(options.instance);
                jQuery('#midgardcreate-save').button({disabled: true});
            });
            
            widget.element.bind('midgardeditableenable', function(event, options) {
                if (options.instance.id) {
                    widget._readLocal(options.instance);
                }
                _.each(options.instance.attributes, function(attributeValue, property) {
                    if (attributeValue instanceof widget.vie.Collection) {
                        //widget._readLocalReferences(options.instance, property, attributeValue);
                    }
                });
            });
            
            widget.element.bind('midgardstorageloaded', function(event, options) {
                if (_.indexOf(widget.options.changedModels, options.instance) === -1) {
                    widget.options.changedModels.push(options.instance);
                }
                jQuery('#midgardcreate-save').button({disabled: false});
            });
        },
        
        _saveRemote: function(options) {
            var widget = this;
            widget._trigger('save', null, {
                models: widget.options.changedModels
            });
            var needed = widget.options.changedModels.length;
            if (needed > 1) {
                notification_msg = needed + ' objects saved successfully';
            } else {
                subject = widget.options.changedModels[0].getSubject().toString();
                subject = subject.replace('<', '&lt;').replace('>', '&gt;');
                notification_msg = 'Object with subject '+subject+' saved successfully';
            }
            
            _.forEach(widget.options.changedModels, function(model, index) {
                model.save(null, {
                    success: function() {
                        if (model.originalAttributes) {
                            // From now on we're going with the values we have on server
                            delete model.originalAttributes;
                        }
                        widget._removeLocal(model);
                        widget.options.changedModels.splice(index, 1);
                        needed--;
                        if (needed <= 0) {                            
                            // All models were happily saved
                            widget._trigger('saved', null, {});
                            options.success();
                            jQuery('body').data('midgardCreate').showNotification({body: notification_msg});
                        }
                    },
                    error: function(m, err) {                        
                        notification_msg = 'Error occurred while saving';
                        if (err.responseText) {
                            notification_msg = notification_msg + ':<br />' + err.responseText;
                        }
                        
                        options.error();
                        jQuery('body').data('midgardCreate').showNotification({body: notification_msg});
                    }
                });
            });
        },

        _saveLocal: function(model) {
            if (!this.options.localStorage) {
                return;
            }

            if (typeof model.id === 'object') {
                // Anonymous object, save as refs instead
                if (!model.primaryCollection) {
                    return;
                }
                return this._saveLocalReferences(model.primaryCollection.subject, model.primaryCollection.predicate, model);
            }
            localStorage.setItem(model.getSubject(), JSON.stringify(model.toJSONLD()));
        },
        
        _getReferenceId: function(model, property) {
            return model.id + ':' + property;
        },
        
        _saveLocalReferences: function(subject, predicate, model) {
            if (!this.options.localStorage) {
                return;
            }
            
            if (!subject ||
                !predicate) {
                return;
            }
            
            var widget = this;
            var identifier = subject + ':' + predicate;
            var json = model.toJSONLD();
            if (localStorage.getItem(identifier)) {
                var referenceList = JSON.parse(localStorage.getItem(identifier));
                var index = _.pluck(referenceList, '@').indexOf(json['@']);
                if (index !== -1) {
                    referenceList[index] = json;
                } else {
                    referenceList.push(json);
                }
                localStorage.setItem(identifier, JSON.stringify(referenceList));
                return;
            }
            localStorage.setItem(identifier, JSON.stringify([json]));
        },

        _readLocal: function(model) {
            if (!this.options.localStorage) {
                return;
            }
            
            var local = localStorage.getItem(model.getSubject());
            if (!local) {
                return;
            }
            if (!model.originalAttributes) {
              model.originalAttributes = _.clone(model.attributes);
            }
            var entity = this.vie.EntityManager.getByJSONLD(JSON.parse(local));
            
            this._trigger('loaded', null, {
                instance: entity
            });
        },
        
        _readLocalReferences: function(model, property, collection) {
            if (!this.options.localStorage) {
                return;
            }
            
            var identifier = this._getReferenceId(model, property);
            var local = localStorage.getItem(identifier);
            if (!local) {
                return;
            }
            collection.add(JSON.parse(local));
        },
        
        _restoreLocal: function(model) {
            var widget = this;
            // Remove unsaved collection members
            _.each(model.attributes, function(attributeValue, property) {
                if (attributeValue instanceof widget.vie.Collection) {
                    attributeValue.forEach(function(model) {
                        if (!model.id) {
                            attributeValue.remove(model);
                        }
                    });
                }
            });
            
            // Restore original object properties
            if (jQuery.isEmptyObject(model.changedAttributes())) {
                if (model.originalAttributes) {
                    model.set(model.originalAttributes);
                    delete model.originalAttributes;
                }
                return;
            }
            model.set(model.previousAttributes());
        },
        
        _removeLocal: function(model) {
            if (!this.options.localStorage) {
                return;
            }
            
            localStorage.removeItem(model.getSubject());
        }
    });
})(jQuery);
(function(jQuery, undefined) {
    jQuery.widget('Midgard.midgardTags', {
        options: {
            vie: null,
            entity: null,
            element: null,
            entityElement: null
        },

        _init: function() {

            this.vie = this.options.vie;
            this.entity = this.options.entity;
            this.element = this.options.element;

            var subject = this.entity.getSubject();

            // insert settings pane
            var id = subject.replace(/[^A-Za-z]/g, '-');
            this.pane = $('<div class="hiddenfieldsContainer"><div class="hiddenfieldsToggle"></div><div class="hiddenfields"><div class="hiddenfieldsCloseButton"></div><h2>Article settings</h2><div id="articleTagsWrapper"><form><div class="articleTags"><h3>Article tags</h3><input type="text" id="' + id + '-articleTags" class="tags" value="" /></div><div class="articleSuggestedTags"><h3>Suggested tags</h3><input type="text" id="' + id + '-suggestedTags" class="tags" value="" /></div></form></div></div><div class="hiddenfieldsCloseCorner"></div></div>')
            this.pane = this.pane.insertBefore(this.element);
            this.articleTags = this.pane.find('.articleTags input');
            this.suggestedTags = this.pane.find('.articleSuggestedTags input');

            // bind toggle events for settings pane
            this.pane.find('.hiddenfieldsToggle').click(function(event) {
                var context = $(this).closest('.hiddenfieldsContainer');
                $('.hiddenfields', context).show();
                $('.hiddenfieldsToggle', context).hide();
                $('.hiddenfieldsCloseCorner', context).show();
                $('.hiddenfieldsCloseButton', context).show();
            });

            var that = this;
            this.pane.find('.hiddenfieldsCloseCorner, .hiddenfieldsCloseButton').click(function(event) {
                that.closeTags();
            });

            $(document).click(function(e) {
                if ($(e.target).closest('.hiddenfieldsContainer').size() == 0 && $('.hiddenfieldsCloseCorner:visible').length > 0){
                    that.closeTags();
                }
            });

            this.articleTags.tagsInput({
                width:'auto',
                height: 'auto',
                onAddTag: function (tag) {

                    var entity = that.entity;

                    // convert to reference url
                    if (!entity.isReference(tag)) {
                        tag = 'urn:tag:' + tag;
                    }

                    // add tag to entity
                    entity.attributes['<http://purl.org/dc/elements/1.1/subject>'].vie = that.vie;
                    entity.attributes['<http://purl.org/dc/elements/1.1/subject>'].addOrUpdate({'@subject': tag});
                },
                onRemoveTag: function (tag) {

                    // remove tag from entity
                    that.entity.attributes['<http://purl.org/dc/elements/1.1/subject>'].remove(tag);
                },
                label: this.tagLabel
            });

            this.suggestedTags.tagsInput({
                width:'auto',
                height: 'auto',
                interactive: false,
                label: this.tagLabel,
                remove: false
            });

            // add suggested tag on click to tags
            $('#' + id + '-suggestedTags_tagsinput .tag span').live('click', function() {

                var tag = $(this).text();
                that.articleTags.addTag($(this).data('value'));
                that.suggestedTags.removeTag($.trim(tag));

                return false;
            });

            this.loadTags();
        },

        closeTags: function () {
            var context = $('.hiddenfieldsContainer');
            $('.hiddenfields', context).hide();
            $('.hiddenfieldsToggle', context).show();
            $('.hiddenfieldsCloseCorner', context).hide();
            $('.hiddenfieldsCloseButton', context).hide();

            // save on close
            this.options.deactivated();
        },

        loadTags: function () {

            var that = this;

            // load article tags
            var tags = this.entity.attributes['<http://purl.org/dc/elements/1.1/subject>'].models;
            jQuery(tags).each(function () {
                that.articleTags.addTag(this.id);
            });

            // load suggested tags
            that.vie.analyze({element: this.options.entityElement}).using(['stanbol']).execute().success(function(enhancements) {
                return $(enhancements).each(function(i, e) {

                    if (typeof e.attributes == 'undefined') {

                        if (e['<http://www.w3.org/2000/01/rdf-schema#label>']) {
                            that.suggestedTags.addTag(e['@subject']);
                        }

                    } else {

                        // Backward compability
                        if (e.attributes['<rdfschema:label>']) {
                            that.suggestedTags.addTag(e.id);
                        }
                    }
                });
            }).fail(function(xhr) {
                console.log(xhr);
            });
        },

        tagLabel: function (value) {

            if (value.substring(0, 9) == '<urn:tag:') {
                value = value.substring(9, value.length - 1);
            }

            if (value.substring(0, 8) == '<http://') {
                value = value.substring(value.lastIndexOf('/') + 1, value.length - 1);
                value = value.replace(/_/g, ' ');
            }

            return value;
        }
    });
})(jQuery);
(function(jQuery, undefined) {
    jQuery.widget('Midgard.midgardToolbar', {
        options: {
            display: 'full',
            statechange: function() {}
        },
    
        _create: function() {
            this.element.append(this._getMinimized().hide());
            this.element.append(this._getFull());
            
            var widget = this;
            jQuery('#midgard-bar-minimized').click(function() {
                widget.show();
                widget._trigger('statechange', null, {display: 'full'});
            });
            jQuery('#midgard-bar-hidebutton').click(function() {
                widget.hide();
                widget._trigger('statechange', null, {display: 'minimized'});
            });
            
            this._setDisplay(this.options.display);
            
            this._createWorkflowsHolder();
            widget = this;
            
            jQuery(this.element).bind('midgardcreatestatechange', function(event, options) {
                if (options.state == 'browse') {
                    widget._clearWorkflows();
                }
            });
            
            jQuery(this.element).bind('midgardworkflowschanged', function(event, options) {
                widget._clearWorkflows();
                if (options.workflows.length) {
                    options.workflows.each(function(workflow) {
                        html = jQuery('body').data().midgardWorkflows.prepareItem(model, workflow, function(err, model) {
                            widget._clearWorkflows();
                            if (err) {
                                //console.log('WORKFLOW ACTION FAILED',err);
                                return;
                            }
                            //console.log('WORKFLOW ACTION FINISHED');
                        });
                        jQuery('.workflows-holder', this.element).append(html);
                    });
                }
            });
        },
        
        _setOption: function(key, value) {
            if (key === 'display') {
                this._setDisplay(value);
            }
            this.options[key] = value;
        },
        
        _setDisplay: function(value) {
            if (value === 'minimized') {
                this.hide();
            } else {
                this.show();
            } 
        },
        
        hide: function() {
            jQuery('#midgard-bar:visible', this.element).slideToggle();
            jQuery('#midgard-bar-minimized:hidden', this.element).slideToggle();
        },
        
        show: function() {
            jQuery('#midgard-bar-minimized:visible', this.element).slideToggle();
            jQuery('#midgard-bar:hidden', this.element).slideToggle();
        },
        
        _getMinimized: function() {
            return jQuery('<a id="midgard-bar-minimized" class="midgard-create ui-widget-showbut"></a>');
        },
        
        _getFull: function() {
            return jQuery('<div class="midgard-create" id="midgard-bar"><div class="ui-widget-content"><div class="toolbarcontent"><div class="midgard-logo-button"><a id="midgard-bar-hidebutton" class="ui-widget-hidebut"></a></div><div class="toolbarcontent-left"></div><div class="toolbarcontent-center"></div><div class="toolbarcontent-right"></div></div></div>');
        },
        
        _createWorkflowsHolder: function() {
            if (jQuery('.workflows-holder', this.element).length) {
                return;
            }
            jQuery('.toolbarcontent-center', this.element).append('<div class="workflows-holder" />');
        },
        
        _clearWorkflows: function() {
            jQuery('.workflows-holder', this.element).empty();
        }        
    });
})(jQuery);
(function(jQuery, undefined) {
    
    jQuery.widget('Midgard.midgardWorkflows', {
        options: {
            url: function(model){},
            renderers: {
              button: function(model, workflow, action_cb, final_cb) {
                  button_id = 'midgardcreate-workflow_' + workflow.get('name');
                  html = jQuery('<button id="'+button_id+'">'+workflow.get('label')+'</button>').button();

                  html.bind('click', function(evt) {
                      action_cb(model, workflow, final_cb);
                  });
                  return html;
              }
            },
            action_types: {
                backbone_save: function(model, workflow, callback) {
                    copy_of_url = model.url;
                    original_model = model.clone();
                    original_model.url = copy_of_url;

                    action = workflow.get("action")
                    if (action.url) {
                        model.url = action.url                        
                    }
                    original_model.save(null, {
                        success: function(m) {
                            model.url = copy_of_url;
                            model.change();
                            callback(null, model);
                        },
                        error: function(m, err) {
                            model.url = copy_of_url;
                            model.change();
                            callback(err, model);
                        }
                    });
                },
                backbone_destroy: function(model, workflow, callback) {
                    copy_of_url = model.url;
                    original_model = model.clone();
                    original_model.url = copy_of_url;
                    
                    action = workflow.get("action")
                    if (action.url) {
                        model.url = action.url
                    }

                    model.destroy({
                        success: function(m) {
                            model.url = copy_of_url;
                            model.change();
                            callback(null, m);
                        },
                        error: function(m, err) {
                            model.url = copy_of_url;
                            model.change();
                            callback(err, model);
                        }
                    });
                },
                http: function(model, workflow, callback) {
                    action = workflow.get("action")
                    if (!action.url) {
                        return callback('No action url defined!');
                    }
                    
                    wf_opts = {};
                    if (action.http) {
                      wf_opts = action.http;
                    }
                    
                    ajax_options = jQuery.extend({
                        url: action.url,
                        type: 'POST',
                        data: model.toJSON(),
                        success: function() {
                            model.fetch({
                              success: function(model) {
                                  callback(null, model);
                              },
                              error: function(model, err) {
                                  callback(err, model);
                              }
                            });
                        }
                    }, wf_opts);
                    
                    jQuery.ajax(ajax_options);
                }
            }
        },
        
        _init: function() {
            this._renderers = {};
            this._action_types = {};
            
            this._parseRenderersAndTypes();
            
            this._last_instance = null;
          
            this.ModelWorkflowModel = Backbone.Model.extend({
                defaults: {
                    name: '',
                    label: '',
                    type: 'button',
                    action: {
                      type: 'backbone_save'
                    }
                }
            });
          
            this.workflows = {};
          
            var widget = this;          
            jQuery(this.element).bind('midgardeditableactivated', function(event, options) {
                model = options.instance;
                if (model.isNew()) {
                    widget._trigger('changed', null, {
                        instance: model,
                        workflows: []
                    });
                    return;
                }
              
                if (widget._last_instance == model) {
                    if (widget.workflows[model.cid]) {
                      widget._trigger('changed', null, {
                          instance: model,
                          workflows: widget.workflows[model.cid]
                      });
                    }
                    return;
                }
                widget._last_instance = model;
            
                if (widget.workflows[model.cid]) {
                    widget._trigger('changed', null, {
                        instance: model,
                        workflows: widget.workflows[model.cid]
                    });
                    return;
                }
            
                if (widget.options.url) {
                    widget._fetchModelWorkflows(model);
                } else {
                    flows = new (widget._generateCollectionFor(model))([], {});
                    widget._trigger('changed', null, {
                        instance: model,
                        workflows: flows
                    });
                }
            });
        },
        
        _parseRenderersAndTypes: function() {
            var widget = this;
            jQuery.each(this.options.renderers, function(k, v) {
                widget.setRenderer(k, v);
            });
            jQuery.each(this.options.action_types, function(k, v) {
                widget.setActionType(k, v);
            });
        },
        
        setRenderer: function(name, callbacks) {
            this._renderers[name] = callbacks;
        },
        getRenderer: function(name) {
            if (!this._renderers[name]) {
                return false;
            }
            
            return this._renderers[name];
        },
        setActionType: function(name, callback) {
            this._action_types[name] = callback;
        },
        getActionType: function(name) {
            return this._action_types[name];
        },
        
        prepareItem: function(model, workflow, final_cb) {
            var widget = this;

            renderer = this.getRenderer(workflow.get("type"));
            action_type_cb = this.getActionType(workflow.get("action").type);
            
            return renderer(model, workflow, action_type_cb, function(err, m) {
                delete widget.workflows[model.cid];
                widget._last_instance = null;
                
                final_cb(err, m);
            });
        },
        
        _generateCollectionFor: function(model) {
            var collectionSettings = {
                model: this.ModelWorkflowModel
            };
            if (this.options.url) {
                collectionSettings['url'] = this.options.url(model);
            }
            return Backbone.Collection.extend(collectionSettings);
        },
        
        _fetchModelWorkflows: function(model) {          
          var widget = this;
          
          widget.workflows[model.cid] = new (this._generateCollectionFor(model))([], {});
          widget.workflows[model.cid].fetch({
              success: function(collection) {
                  widget.workflows[model.cid].reset(collection.models);

                  widget._trigger('changed', null, {
                      instance: model,
                      workflows: widget.workflows[model.cid]
                  });
              },
              error: function(model, err) {
                  console.log('error fetching flows',err);
              }
            });
        }
    });
})(jQuery);
