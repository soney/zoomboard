(function() {
$.widget("ui.zoomboard", {
	options: { 
		img_srcs: ["ZoomBoard3b.png", "symbols3b.png"]
		, keymaps: [keys, keys_sym]
		, keyboard_names: ["ZB", "#"]
		, zoom_factor: 2.2 
		, original_scale: 0.12
		, max_zoom: 1.0
		, reset_on_max_zoom: true
		, reset_timeout: 1000
		, center_bias: -0.15
		, is_ipad: navigator.userAgent.match(/iPad/i) != null
		, anim_time: 0.1
		, min_swipe_x: 40
		, min_swipe_y: 30
    }
	, _create: function() {
		$.Widget.prototype._create.call(this);
		var self = this;
		this.original_position = {
			x: 0, y: 0, width: 0, height: 0
		};
		this.original_dimensions = {width:0, height:0};
		this.position = {};
		this.img = $("<img />")	.appendTo(this.element)
								.css({
									position: "absolute"
									, left: "0px"
									, top: "0px"
									, "pointer-events": "none"
									, "-webkit-transition": "all " + this.option("anim_time") + "s ease-out"
								})
								.bind("load", function(event) {
									var width = self.img[0]["naturalWidth"]
										, height = self.img[0]["naturalHeight"];
									self.original_dimensions.width = width;
									self.original_dimensions.height = height;
									var scaled_width = self.option("original_scale") * width;
									var scaled_height = self.option("original_scale") * height;

									self.original_position.width = scaled_width;
									self.original_position.height = scaled_height;
									self.img.css({
										width: scaled_width+"px"
										, height: scaled_height+"px"
									});
									self.set_position(self.original_position);

									self.element.css({
										width: scaled_width+"px"
										, height: scaled_height+"px"
									});
								});
								this.img.on("load", $.proxy(function(event) {
									window.setTimeout($.proxy(function() {
										this.overlay.css("font-size", (this.img.height()/1.2)+"px");
									}, this), 500);
								}, this));
		this.overlay = $("<div />")	.appendTo(this.element)
									.addClass("overlay")
									.css({
										"height": "100%"
										, "width": "100%"
										, "position": "absolute"
										, "pointer-events": "none"
										, "-webkit-transition": "opacity 0.2s ease-in-out"
										, "color": "white"
										, "text-align": "center"
										, "font-size": (this.img.height()/1.2)+"px"
										, "text-shadow": "0px 0px 4px #000"
										, "background-color": "rgba(0,0,0,0.4)"
										, "font-family": '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif'
										, "opacity": 0
										, "text-transform": "capitalize"
										, "line-height": "normal"
									});
		this.element.css({
			position: "relative"
			, overflow: "hidden"
		});
		if(this.option("is_ipad")) {
			var self = this;
			this.element.on("touchstart.zoomboard_swipe", function(ts_e) {
				var is_moving = false;
				if(self.starting_position && ts_e.originalEvent.touches.length === 1) {
					var startX = ts_e.originalEvent.touches[0].pageX;
					var startY = ts_e.originalEvent.touches[0].pageY;
					is_moving = true;

					var remove_event_handlers = function() {
						is_moving = false;
						self.element.off("touchmove.zb_swipe");
						self.element.off("touchend.zb_swipe");
						startX = startY = null;
					};
					self.element.on("touchmove.zb_swipe", function(e) {
						if(is_moving === true) {
							var x = e.originalEvent.touches[0].pageX;
							var y = e.originalEvent.touches[0].pageY;
							var dx = startX - x; var dy = startY - y;

							if(Math.abs(dx) >= self.option("min_swipe_x")) {
								if(dx > 0) {
									self.on_swipe("left");
									remove_event_handlers();
									self.just_gestured = true;
								} else {
									self.on_swipe("right");
									remove_event_handlers();
									self.just_gestured = true;
								}
							} else if(Math.abs(dy) >= self.option("min_swipe_y")) {
								if(dy > 0) {
									self.on_swipe("up");
									remove_event_handlers();
									self.just_gestured = true;
								} else {
									self.on_swipe("down");
									remove_event_handlers();
									self.just_gestured = true;
								}
							}
						}
					});
					self.element.on("touchend.zb_swipe", function() {
						remove_event_handlers();
					});
				}
			});
			this.element.on("touchstart.zoomboard", _.bind(this.on_element_click, this));
		} else {
			this.element.on("mousedown.zoomboard", _.bind(this.on_element_click, this));
			$(window).on("mousedown.zoomboard", function(event) {
				event.preventDefault();
				event.stopPropagation();
				return false;
			});
			var self = this;
			$(window).on("keydown.zoomboard", function(event) {
				if(event.keyCode === 37) { //left
					self.on_swipe("left");
				} else if(event.keyCode === 39) { //right
					self.on_swipe("right");
				} else if(event.keyCode === 38) { //up
					self.on_swipe("up");
				} else if(event.keyCode === 40) { //down
					self.on_swipe("down");
				}
			});
		}
		this.reset_timeout = undefined;
		this.set_keyboard_index(0);
		this.starting_position = true;
		this.just_gestured = false;
    }
	, destroy: function() {
		this.img.remove();
		this.element.css({
			position: ""
			, overflow: ""
		});
		if(this.option("is_ipad")) {
			this.element.off("touchstart.zoomboard");
			$(window).off("touchstart.zoomboard");
		} else {
			this.element.off("mousedown.zoomboard");
			$(window).off("mousedown.zoomboard");
			$(window).off("keydown.zoomboard");
		}

		$.Widget.prototype.destroy.call(this);
	}
	, set_keyboard_index: function(index) {
		var img_src = this.option("img_srcs")[index];
		var keymap = this.option("keymaps")[index];
		var keyboard_name = this.option("keyboard_names")[index];

		this.img.attr("src", img_src);
		this.keymap = keymap;
		this.keyboard_index = index;
		this.flash(keyboard_name, 500, "yellow");
	}
	, get_keyboard_index: function() {
		return this.keyboard_index;
	}
	, get_num_keyboards: function() {
		return this.option("img_srcs").length;
	}
	, on_swipe: function(direction) {
		var zoomswipe_event = jQuery.Event("zb_swipe");
		zoomswipe_event.direction = direction;
		this.element.trigger(zoomswipe_event);
		this.reset(false);

		if(direction === "left") {
			var zoomkey_event = jQuery.Event("zb_key");
			zoomkey_event.key = "delete";
			zoomkey_event.entry_type = "swipe";
			this.element.trigger(zoomkey_event);
			this.flash("&#9224");
		} else if(direction === "right") {
			var zoomkey_event = jQuery.Event("zb_key");
			zoomkey_event.key = "space";
			zoomkey_event.entry_type = "swipe";
			this.element.trigger(zoomkey_event);
			this.flash("&#9251");
		} else if(direction === "up") {
			var keyboard_index = this.get_keyboard_index();
			var num_keyboards = this.get_num_keyboards();
			keyboard_index++;

			if(keyboard_index >= num_keyboards) {
				keyboard_index = 0;
			}

			this.set_keyboard_index(keyboard_index);
		} else if(direction === "down") {
			var keyboard_index = this.get_keyboard_index();

			keyboard_index--;

			if(keyboard_index < 0) {
				var num_keyboards = this.get_num_keyboards();
				keyboard_index = num_keyboards-1;
			}

			this.set_keyboard_index(keyboard_index);
		}
	}
	, on_element_click: function(event) {
		if(this.option("is_ipad")) {
			event.preventDefault();
			event.stopPropagation();
		} else {
			event.preventDefault();
			event.stopPropagation();
		}

		var do_zoom = $.proxy(function(x, y) {
			var zoomtouch_event = jQuery.Event("zb_zoom");
			zoomtouch_event.x = x;zoomtouch_event.y = y;
			this.element.trigger(zoomtouch_event);

			var new_position = _.clone(this.position);
			var scale_factor = this.option("zoom_factor");
			var center_bias = this.option("center_bias");
			var current_zoom = this.position.width / this.original_dimensions.width;

			var max_zoom = this.option("max_zoom");

			if(scale_factor * current_zoom > max_zoom) {
				scale_factor = max_zoom / current_zoom;
				var original_image_point = {
					x: x/current_zoom
					, y: y/current_zoom
				};
				var key = this.get_key_for_point(original_image_point)
				var zoomkey_event = jQuery.Event("zb_key");
				zoomkey_event.key = key.key;
				zoomkey_event.entry_type = "press";
				this.element.trigger(zoomkey_event);
				if(key.key === "space") {
					this.flash("&#9251;");
				} else {
					this.flash(key.key);
				}
				this.reset();
				return;
			} else {
				this.starting_position = false;
				var center_x = this.original_position.width/2;
				var center_y = this.original_position.height/2;
				var center_nudge_x = (center_bias * (center_x - x))/(current_zoom*12);
				var center_nudge_y = (center_bias*2 * (center_y - y))/(current_zoom*8);

				new_position.width *= scale_factor;
				new_position.height *= scale_factor;
				new_position.x -= (x+center_nudge_x)*(scale_factor-1);
				new_position.y -= (y+center_nudge_y)*(scale_factor-1);
				this.set_position(new_position);
			}
		}, this);


		this.clear_reset_timeout();
		if(this.option("is_ipad")) {
			$(this.element).one("touchend", $.proxy(function(event) {
				if(this.just_gestured === true) {
					this.just_gestured = false;
					return;
				}
				if(event.originalEvent.touches.length === 0) {
					var offset = this.element.offset();
					var x = event.originalEvent.changedTouches[0].pageX - offset.left - this.position.x;
					var y = event.originalEvent.changedTouches[0].pageY - offset.top  - this.position.y;
					do_zoom(x, y);
					this.reset_reset_timeout();
				}
			}, this));
		} else {
			$(this.element).one("mouseup", $.proxy(function(event) {
				var x = event.offsetX - this.position.x;
				var y = event.offsetY - this.position.y;
				do_zoom(x, y);
				this.reset_reset_timeout();
			}, this));
		}

		return false;
	}
	, set_position: function(position, non_animated) {
		if(non_animated === true) {
			this.img.css("-webkit-transition", "none");
			this.img.css("-webkit-transition", "all 0.001s ease-out");
		}
		this.img.css({
			left: position.x+"px"
			, top: position.y+"px"
			, width: position.width+"px"
			, height: position.height+"px"
		});
		this.position = position;
		if(non_animated === true) {
			this.img.css("-webkit-transition", "all " + this.option("anim_time") + "s ease-out");
		}
	}
	, reset: function(animated) {
		this.set_position(this.original_position, animated === false);
		this.clear_reset_timeout();
		this.starting_position = true;
	}
	, get_center_of_position: function(position) {
		return {x: position.x + position.width/2, y: position.y + position.height/2};
	}
	, get_key_for_point:  function(point) {
		var keys = this.keymap;
		var min_distance = false, min_distance_key = null;
		for(var i = 0, len = keys.length; i<len; i++) {
			var key = keys[i];
			if(key.x <= point.x && key.y <= point.y && key.x+key.width >= point.x && key.y + key.height >= point.y) {
				return key;
			} else {
				var key_center_x = key.x + key.width/2;
				var key_center_y = key.y + key.height/2;
				var dx = point.x - key_center_x;
				var dy = point.y - key_center_y;
				var dsquared = Math.pow(dx, 2) + Math.pow(dy, 2);
				if(min_distance_key === null || dsquared < min_distance) {
					min_distance = dsquared;
					min_distance_key = key;
				}
			}
		}
		return min_distance_key;
	}
	, clear_reset_timeout: function() {
		if(this.reset_timeout !== undefined) {
			window.clearTimeout(this.reset_timeout);
		}
		this.reset_timeout = undefined;
	}
	, reset_reset_timeout: function() {
		this.clear_reset_timeout();
		var reset_timeout = this.option("reset_timeout");
		this.reset_timeout = window.setTimeout(_.bind(this.reset, this), reset_timeout);
	}
	, flash: function(text, duration, color) {
		duration = duration || 250;
		color = color || "white";
		window.clearTimeout(this.flash_timeout);
		this.overlay.css({
						"opacity": 0.95
						, "color": color
						})
					.html(text);
		this.flash_timeout = window.setTimeout($.proxy(function() {
			this.overlay.css("opacity", 0);
		}, this), duration);

	}
});
}());
