var resizeCanvas = require('../utils/resizeCanvas'),
	signals = require('../core/signals'),
	ANIMATION_TIME = 0.5,
	CLASS_IS_VISIBLE = 'is-visible';

exports.selector = '.js-card';
exports.constructor = function() {

	var _parent,
		_videoSrc,
		_videoIsSetup,
		_isAlive,
		_isInView,
		_videoEl,
		_sizingEl,
		_canvasEl,
		_context,
		_progress,
		_windowHeight,
		_elementHeight,
		_canvasWidth,
		_canvasHeight,
		_imgUrl,
		_coverUrl,
		_coverEl,
		_imageEl;

	function init(el) {

		_parent = el;

		_sizingEl = el.getElementsByClassName('js-card__size')[0];
		_canvasEl = el.getElementsByClassName('js-card__canvas')[0];
		_imageEl = el.getElementsByClassName('js-card__image')[0];
		_coverEl = el.getElementsByClassName('js-card__cover')[0];
		_context = _canvasEl.getContext('2d');
		_progress = {p:0};
		_videoSrc = _canvasEl.getAttribute('data-mp4');
		_imgUrl = _imageEl.getAttribute('data-src');
		_coverUrl = _coverEl.getAttribute('data-src');

		_videoIsSetup = false;
		_isInView = false;
		_windowHeight = window.innerHeight;

		signals.SCROLLED.add(onScroll);
		signals.RESIZED.add(onResize);
		onResize();
		onScroll();
	}

	function onScroll() {

		var scrollTop = window.pageYOffset || document.scrollTop || 0,
			offset = _parent.getBoundingClientRect().top + scrollTop;

		if(_windowHeight + scrollTop > offset && scrollTop < offset + _elementHeight) {

			inView();
		}
	}

	function destroy() {

		_isAlive = false;
		_videoIsSetup = false;

		_videoEl = null;
		TweenLite.killTweensOf(_progress);

		_parent.removeEventListener('mouseenter', onMouseOver);
		_parent.removeEventListener('mouseleave', onMouseOut);
		_parent.removeEventListener('mouseenter', onMouseOver);
		_parent.removeEventListener('mouseleave', onMouseOut);

		signals.SCROLLED.remove(onScroll);
	}

	function onMouseOver() {

		if(!_videoIsSetup) {

			setupVideo();
		}

		_isAlive = true;
		redraw();

		if(_videoEl) {

			_videoEl.play()
				.catch(function(){});
		}

		TweenLite.to(_progress, ANIMATION_TIME, {
			p:1,
			ease: Cubic.easeInOut
		})
	}

	function onMouseOut() {

		TweenLite.to(_progress, ANIMATION_TIME, {
			p:0,
			ease: Cubic.easeInOut,
			onComplete:function(){

				if(_videoEl) {

					_videoEl.pause();
					_videoEl.currentTime = 0;
				}
				_isAlive = false;
			}
		})
	}


	function inView() {

		_isInView = true;
		_parent.classList.add(CLASS_IS_VISIBLE);

		loadImage();
		redraw();

		_parent.addEventListener('touchstart', onTouchStart);
		_parent.addEventListener('touchend', onTouchEnd);
		_parent.addEventListener('mouseenter', onMouseOver);
		_parent.addEventListener('mouseleave', onMouseOut);

		signals.SCROLLED.remove(onScroll);
	}

	function onTouchStart() {

		_parent.removeEventListener('mouseenter', onMouseOver);
		_parent.removeEventListener('mouseleave', onMouseOut);
	}

	function onTouchEnd() {

		_parent.addEventListener('mouseenter', onMouseOver);
		_parent.addEventListener('mouseleave', onMouseOut);
	}

	function loadImage() {

		_imageEl.onload = onLoaded;
		_imageEl.src = _imgUrl;

		function onLoaded() {

			_imageEl.classList.add(CLASS_IS_VISIBLE);
		}
	}

	function setupVideo() {

		if(_videoSrc) {

			_videoEl = document.createElement('video');
			_videoEl.loop = true;
			_videoEl.src = _videoSrc;
		}

		_coverEl.src = _coverUrl;

		_videoIsSetup = true;
	}



	function redraw() {

		_context.clearRect(0, 0, _canvasWidth, _canvasHeight);

		if(_progress.p > 0) {

			drawMask(_progress.p);
		}

		if(_isAlive) {

			requestAnimationFrame(redraw);
		}
	}


	function drawMask(progress) {

		var firstHalfProgress = Math.min(1, progress * 2),
			secondHalfProgress = Math.max(0, (progress - 0.5) * 2);// eslint-disable-line

		_context.save();

		_context.beginPath();

		// start at bottom left
		_context.moveTo(0, _canvasHeight);

		// absolute line to bottom right, based on firstHalfProgress
		lineTo(Math.round(_canvasWidth * firstHalfProgress), _canvasHeight);

		// if we passed the first half, we draw two additional lines trying to fill up the screen
		if(secondHalfProgress) {

			lineTo(_canvasWidth, Math.round(_canvasHeight * (1 - secondHalfProgress)));
			lineTo(Math.round(_canvasWidth * secondHalfProgress), 0);
		}



		// absolute line back to top left, based on firstHalfProgress
		lineTo(0, Math.round(_canvasHeight * (1 - firstHalfProgress)));

		// close up our path
		_context.closePath();

		_context.clip();

		_context.drawImage(_coverEl, 0, 0, _canvasWidth, _canvasHeight);

		if(_videoEl) {

			_context.drawImage(_videoEl, 0, 0, _canvasWidth, _canvasHeight);
		}


		_context.restore();

		function lineTo(x, y) {

			_context.lineTo(x, y);
		}
	}

	function onResize() {

		_windowHeight = window.innerHeight;
		_canvasWidth = _sizingEl.offsetWidth;
		_canvasHeight = _sizingEl.offsetHeight;

		_imageEl.setAttribute('width', _canvasWidth);
		_imageEl.setAttribute('height', _canvasHeight);

		_coverEl.setAttribute('width', _canvasWidth);
		_coverEl.setAttribute('height', _canvasHeight);

		_elementHeight = _parent.offsetHeight;

		resizeCanvas(_canvasEl, _canvasWidth, _canvasHeight);

		if(!_isAlive) {

			redraw();
		}

		if(!_isInView) {

			onScroll();
		}
	}

	this.init = init;
	this.destroy = destroy;
};