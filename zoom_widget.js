(function() {
$.widget("ui.zoomboard", {
	options: { 
		img_src: "ZoomBoard3b.png"
		, zoom_factor: 2.2 
		, original_scale: 0.15
		, max_zoom: 1.0
		, reset_on_max_zoom: true
		, key_info: keys
		, reset_timeout: 1000
		, center_bias: -0.15
		, is_ipad: navigator.userAgent.match(/iPad/i) != null
    }
	, _create: function() {
		$.Widget.prototype._create.call(this);
		var self = this;
		this.original_position = {
			x: 0, y: 0, width: 0, height: 0
		};
		this.original_dimensions = {width:0, height:0};
		this.position = {};
		this.img = $("<img />")	.attr("src", this.option("img_src"))
								.appendTo(this.element)
								.css({
									position: "absolute"
									, left: "0px"
									, top: "0px"
									, "pointer-events": "none"
									, "-webkit-transition": "all 0.1s ease-out"
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
		this.element.css({
			position: "relative"
			, overflow: "hidden"
		});
		if(this.option("is_ipad")) {
			this.element.bind("touchstart.zoomboard", _.bind(this.on_element_click, this));
			$(window).bind("touchstart.zoomboard", function(event) {
				event.preventDefault();
				event.stopPropagation();
				return false;
			});
		} else {
			this.element.bind("mousedown.zoomboard", _.bind(this.on_element_click, this));
			$(window).bind("mousedown.zoomboard", function(event) {
				event.preventDefault();
				event.stopPropagation();
				return false;
			});
		}
		this.reset_timeout = undefined;
    }
	, destroy: function() {
		this.img.remove();
		this.element.css({
			position: ""
			, overflow: ""
		});
		if(this.option("is_ipad")) {
			this.element.unbind("touchstart.zoomboard");
			$(window).unbind("touchstart.zoomboard");
		} else {
			this.element.unbind("mousedown.zoomboard");
			$(window).unbind("mousedown.zoomboard");
		}

		$.Widget.prototype.destroy.call(this);
	}
	, on_element_click: function(event) {
		var x,y;
		var offset = this.element.offset();
		if(this.option("is_ipad")) {
			var offset = this.element.offset();
			x = event.originalEvent.pageX - offset.left - this.position.x;
			y = event.originalEvent.pageY - offset.top  - this.position.y;
		} else {
			x = event.offsetX - this.position.x;
			y = event.offsetY - this.position.y;
		}

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
			var event = jQuery.Event("zoomkey");
			event.key = key.key;
			this.element.trigger(event);
			this.reset();
			return;
		}

		var center_x = this.original_position.width/2;
		var center_y = this.original_position.height/2;
		var center_nudge_x = (center_bias * (center_x - x))/(current_zoom*12);
		var center_nudge_y = (center_bias*2 * (center_y - y))/(current_zoom*8);

		new_position.width *= scale_factor;
		new_position.height *= scale_factor;
		new_position.x -= (x+center_nudge_x)*(scale_factor-1);
		new_position.y -= (y+center_nudge_y)*(scale_factor-1);
		this.set_position(new_position);
		event.preventDefault();
		event.stopPropagation();
		this.reset_reset_timeout();
		return false;
	}
	, set_position: function(position) {
		this.img.css({
			left: position.x+"px"
			, top: position.y+"px"
			, width: position.width+"px"
			, height: position.height+"px"
		});
		this.position = position;
	}
	, reset: function() {
		this.set_position(this.original_position);
		this.clear_reset_timeout();
	}
	, get_center_of_position: function(position) {
		return {x: position.x + position.width/2, y: position.y + position.height/2};
	}
	, get_key_for_point:  function(point) {
		var keys = this.option("key_info");
		for(var i = 0, len = keys.length; i<len; i++) {
			var key = keys[i];
			if(key.x <= point.x && key.y <= point.y && key.x+key.width >= point.x && key.y + key.height >= point.y) {
				return key;
			}
		}
		return undefined;
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
});
}());
