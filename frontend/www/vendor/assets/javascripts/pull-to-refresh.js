(function(window) {
  
  function debounce(fn, delay) {
    var timer = null;
    return function () {
      var context = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  }

  var PullToRefresh = function(options, cb) {
    var self = this;

    var $el = $(options.el);
    var $scrollEl = $(options.scrollEl);
    var $text = $el.find('.text');
    var cb = cb;
    var height = $el.height();
    var threshold = -height * .87;
    var start = null;
    var open = false;
    var resetting = false;
    var dragging = false;
    var offset = (options.offset) ? options.offset : 0;
    var total_height = height + offset;
    var y = 0;

    var messages = {
      initial_state: 'Refreshing data...',
      loading_state: 'Loading...'
    }

    function init() {
      
      window.addEventListener('touchstart',touchStart,false);
      window.addEventListener('touchmove', touchMove, false);
      window.addEventListener('touchend',touchEnd,false);

      $scrollEl.css('position', 'absolute');
    }

    function touchStart(e) {
      // dragging = true;
      // requestAnimationFrame(update);
    }

    function touchMove(e) {
      y = (e.changedTouches)? parseInt(e.changedTouches[0].clientY) : 0;
    }

    function touchEnd(e) {
      dragging = false;
      reset(true);
    }

    function update() {
      console.log('update');
      if( !open && !resetting && window.scrollY === 0) {
        if(!start) { start = y }
        var dist = parseInt(y) - start - height;
        var containerOffset = dist + height * 2 - 30;

        if(dist > threshold) {
          // Distance is within threshold, pop open the refresh.
          self.show();
          if(cb) {
            cb();
          }
        }
        else if (dist < height) {
          // Distance is less than height, just show the refresh box a bit.
          $el.css('transform', 'translate(0, ' + dist + 'px)');
          $scrollEl.css('transform', 'translate(0, ' + containerOffset + 'px)');
        }
      }
      if(dragging) {
        requestAnimationFrame(update);
      }
    }

    function reset(manual) {
      resetting = true;

      if(!open || manual) {
        start = null;
        $el.css('transform', 'translate(0, -' + total_height + 'px)');
        $scrollEl.css('transform', 'translate(0, 0)');
        removeClasses();
      }
    }

    function removeClasses() {
      setTimeout(function() {
        $el.removeClass('pull-to-refresh-active');
        $scrollEl.removeClass('pull-to-refresh-container-active');

        if($text) {
          $text.html(messages.initial_state);
        }

        open = false;
        resetting = false;
      }, 1000);
    }

    this.show = function() {
      
      if(!open) {
        $el.addClass('pull-to-refresh-active');
        $el.css('transform', 'translate(0, -' + offset + 'px)');

        $scrollEl.addClass('pull-to-refresh-container-active');
        $scrollEl.css('transform', 'translate(0, ' + height + 'px)');

        if($text) {
          $text.html(messages.loading_state);
        }
        start = null;
        open = true;
        dragging = false;
      }
    }

    this.close = function() {
      setTimeout(function() {
        reset(true);
      }, 1000);
    }

    this.destroy = function() {
      dragging = false;
      window.removeEventListener('touchstart',touchStart,false);
      window.removeEventListener('touchmove', touchMove, false);
      window.removeEventListener('touchend',touchEnd,false);
    }

    init();
  }

  window.PullToRefresh = PullToRefresh;
}(window));