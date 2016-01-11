(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

var createFit = require('canvas-fit')
var queryString = require('query-string')
var extend = require('util-extend')
var naca = require('../../')

var canvas, ctx, w, h
var n = 100
var xmin = -0.1                  // viewport x-bounds
var xmax = 1.1
var fmax = -0.5               // viewport y-bounds
var fmin = 0.5
var xmm = xmax - xmin
var fmm = fmax - fmin

var params = extend({
  naca: '2412',
  c: 1
}, queryString.parse(location.search))

var c = params.c

var airfoil = naca(params.naca, Number(c))

function xToI (x) { return (x - xmin) / xmm * w }
function yToJ (f) { return (f - fmin) / fmm * h }
function dxTodI (dx) { return dx / xmm * w }
function dyTodJ (dy) { return dy / ymm * h }

function draw () {
  var i, x, y, xy, r
  ctx.clearRect(0, 0, w, h)
  ctx.save()
  ctx.lineWidth = window.devicePixelRatio

  ctx.strokeStyle = '#eee'
  ctx.beginPath()
  for(i = -10; i <= 10; i++) {
    ctx.moveTo(xToI(-1),yToJ(i / 10))
    ctx.lineTo(xToI(2),yToJ(i / 10))
  }
  ctx.stroke()

  ctx.strokeStyle = '#eee'
  ctx.beginPath()
  for(i = -10; i <= 10; i++) {
    ctx.moveTo(xToI(i / 10),yToJ(-1))
    ctx.lineTo(xToI(i / 10),yToJ(1))
  }
  ctx.stroke()

  ctx.strokeStyle = '#000'
  ctx.beginPath()
  xy = airfoil.evaluate(0)
  ctx.moveTo(xToI(xy[0]), yToJ(xy[1]))
  for (i = 1; i < n; i++) {
    x = Math.pow(i / (n - 1), 2) * c
    xy = airfoil.evaluate(x)
    ctx.lineTo(xToI(xy[0]), yToJ(xy[1]))
  }
  ctx.stroke()

  xy = airfoil.evaluate(0)
  ctx.beginPath()
  ctx.moveTo(xToI(xy[2]), yToJ(xy[3]))
  for (i = 1; i < n; i++) {
    x = Math.pow(i / (n - 1), 2) * c
    xy = airfoil.evaluate(x)
    ctx.lineTo(xToI(xy[2]), yToJ(xy[3]))
  }
  ctx.stroke()

  ctx.strokeStyle = '#f00'
  ctx.beginPath()
  y = airfoil.camberLine(0)
  ctx.moveTo(xToI(0), yToJ(y))
  for (i = 1; i < n; i++) {
    x = i / (n - 1) * c
    y = airfoil.camberLine(x)
    ctx.lineTo(xToI(x), yToJ(y))
  }
  ctx.stroke()

  ctx.strokeStyle = '#00f'
  ctx.beginPath()
  r = airfoil.leadingEdgeRadius()
  var y = airfoil.camberLine(r)
  var dycdx = airfoil.camberLineSlope(0)
  var theta = Math.atan(dycdx)
  var x0 = r * Math.cos(theta)
  var y0 = r * Math.sin(theta)
  ctx.arc(xToI(x0), yToJ(y0), dxTodI(r), 0, Math.PI * 2)
  ctx.stroke()

}

window.onload = function() {
  // Get the element:
  canvas = document.getElementById('canvas')

  // Create an auto-fit function:
  var fit = createFit(canvas)

  // Set the fit scale:
  fit.scale = window.devicePixelRatio
  //fit.parent = function () {
    //return [ Math.min(window.innerWidth, 800), Math.min(window.innerHeight, 300) ]
  //}

  function resize () {
    fit()
    ctx = canvas.getContext('2d')
    w = canvas.width
    h = canvas.height
    var dx = xmax - xmin
    var dy = dx * h / w
    fmax = -dy * 0.5
    fmin = dy * 0.5
    fmm = fmax - fmin
    draw()
  }

  window.addEventListener('resize', resize, false)
  resize()

  //function onRaf () {
    //draw()
    //requestAnimationFrame(onRaf)
  //}
  //requestAnimationFrame(onRaf)

}

},{"../../":2,"canvas-fit":3,"query-string":5,"util-extend":7}],2:[function(require,module,exports){
'use strict'

airfoil.thickness = thickness
airfoil.camberLine = camberLine
airfoil.camberLineSlope = camberLineSlope
airfoil.leadingEdgeRadius = leadingEdgeRadius
airfoil.evaluate = evaluate
airfoil.parse = parse

module.exports = airfoil

var nacaCodePattern = /^([0-9])([0-9])([0-9]{2})$/

function parse (nacaCode) {
  if (typeof(nacaCode) !== 'string') {
    throw new Error('NACA airfoil code must be a string. Received ' + typeof(nacaCode))
  }

  var match = nacaCode.match(nacaCodePattern)

  if (!match) {
    throw new Error('NACA airfoil expected a string containing a four-digit identifier. Received "' + nacaCode + '".')
  }

  var mString = match[1]
  var pString = match[2]
  var tString = match[3]

  var m = Number(mString) * 0.01
  var p = Number(pString) * 0.1
  var t = Number(tString) * 0.01

  return {
    p: p,
    m: m,
    t: t,
  }
}

function airfoil (nacaCode, c) {
  var params = parse(nacaCode)

  if (c === undefined) {
    c = 1
  }

  return {
    thickness: function (x) {
      return thickness(x, c, params.t)
    },
    camberLine: function (x) {
      return camberLine(x, c, params.m, params.p)
    },
    camberLineSlope: function(x) {
      return camberLineSlope(x, c, params.m, params.p)
    },
    leadingEdgeRadius: function() {
      return leadingEdgeRadius(params.t, c)
    },
    xLower: function(x) {
      return xLower(x, c, params.m, params.p, params.t)
    },
    xUpper: function(x) {
      return xUpper(x, c, params.m, params.p, params.t)
    },
    yLower: function(x) {
      return yLower(x, c, params.m, params.p, params.t)
    },
    yUpper: function(x) {
      return yUpper(x, c, params.m, params.p, params.t)
    },
    evaluate: function(x) {
      return evaluate(x, c, params.m, params.p, params.t)
    }
  }
}

function thickness (x, c, t) {
  var u = x / c
  var y = -0.5075 * u
  y = u * (y + 1.4215)
  y = u * (y - 1.7580)
  y = u * (y - 0.6300)
  y += 1.4845 * Math.sqrt(u)
  return t * y * c * 2
}

function camberLine (x, c, m, p) {
  var p1
  if (x < p * c) {
    return  m * x / (p * p) * (2 * p - x / c)
  } else {
    var p1 = 1 - p
    return m * (c - x) / (p1 * p1) * (1 + x / c - 2 * p)
  }
}

function camberLineSlope (x, c, m, p) {
  var p1
  if (x < p * c) {
    return 2 * m / (p * p) * (p - x / c)
  } else {
    p1 = 1 - p
    return 2 * m / (p1 * p1) * (p - x / c)
  }
}

function leadingEdgeRadius (t, c) {
  return 1.1019 * t * t * c
}

function xLower(x, c, m, p, t) {
  var yt = thickness(x, c, t)
  var dycdx = camberLineSlope(x, c, m, p)
  var dscdx = Math.sqrt(1 + dycdx * dycdx)
  var stheta = dycdx / dscdx
  return x + 0.5 * yt * stheta
}

function xUpper(x, c, m, p, t) {
  var yt = thickness(x, c, t)
  var dycdx = camberLineSlope(x, c, m, p)
  var dscdx = Math.sqrt(1 + dycdx * dycdx)
  var stheta = dycdx / dscdx
  return x - 0.5 * yt * stheta
}

function yLower (x, c, m, p, t) {
  var yc = camberLine(x, c, m, p)
  var yt = thickness(x, c, t)
  var dycdx = camberLineSlope(x, c, m, p)
  var dscdx = Math.sqrt(1 + dycdx * dycdx)
  var ctheta = 1 / dscdx
  return yc - 0.5 * yt * ctheta
}

function yUpper (x, c, m, p, t) {
  var yc = camberLine(x, c, m, p)
  var yt = thickness(x, c, t)
  var dycdx = camberLineSlope(x, c, m, p)
  var dscdx = Math.sqrt(1 + dycdx * dycdx)
  var ctheta = 1 / dscdx
  return yc + 0.5 * yt * ctheta
}

function evaluate (x, c, m, p, t) {
  var yc = camberLine(x, c, m, p)
  var yt = 0.5 * thickness(x, c, t)
  var dycdx = camberLineSlope(x, c, m, p)
  var dscdx = Math.sqrt(1 + dycdx * dycdx)
  var ctheta = 1 / dscdx
  var stheta = dycdx / dscdx

  return [
    x - yt * stheta,   // xU
    yc + yt * ctheta,  // yU
    x + yt * stheta,   // xL
    yc - yt * ctheta   // yL
  ]
}

},{}],3:[function(require,module,exports){
var size = require('element-size')

module.exports = fit

var scratch = new Float32Array(2)

function fit(canvas, parent, scale) {
  var isSVG = canvas.nodeName.toUpperCase() === 'SVG'

  canvas.style.position = canvas.style.position || 'absolute'
  canvas.style.top = 0
  canvas.style.left = 0

  resize.scale  = parseFloat(scale || 1)
  resize.parent = parent

  return resize()

  function resize() {
    var p = resize.parent || canvas.parentNode
    if (typeof p === 'function') {
      var dims   = p(scratch) || scratch
      var width  = dims[0]
      var height = dims[1]
    } else
    if (p && p !== document.body) {
      var psize  = size(p)
      var width  = psize[0]|0
      var height = psize[1]|0
    } else {
      var width  = window.innerWidth
      var height = window.innerHeight
    }

    if (isSVG) {
      canvas.setAttribute('width', width * resize.scale + 'px')
      canvas.setAttribute('height', height * resize.scale + 'px')
    } else {
      canvas.width = width * resize.scale
      canvas.height = height * resize.scale
    }

    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'

    return resize
  }
}

},{"element-size":4}],4:[function(require,module,exports){
module.exports = getSize

function getSize(element) {
  // Handle cases where the element is not already
  // attached to the DOM by briefly appending it
  // to document.body, and removing it again later.
  if (element === window || element === document.body) {
    return [window.innerWidth, window.innerHeight]
  }

  if (!element.parentNode) {
    var temporary = true
    document.body.appendChild(element)
  }

  var bounds = element.getBoundingClientRect()
  var styles = getComputedStyle(element)
  var height = (bounds.height|0)
    + parse(styles.getPropertyValue('margin-top'))
    + parse(styles.getPropertyValue('margin-bottom'))
  var width  = (bounds.width|0)
    + parse(styles.getPropertyValue('margin-left'))
    + parse(styles.getPropertyValue('margin-right'))

  if (temporary) {
    document.body.removeChild(element)
  }

  return [width, height]
}

function parse(prop) {
  return parseFloat(prop) || 0
}

},{}],5:[function(require,module,exports){
'use strict';
var strictUriEncode = require('strict-uri-encode');

exports.extract = function (str) {
	return str.split('?')[1] || '';
};

exports.parse = function (str) {
	if (typeof str !== 'string') {
		return {};
	}

	str = str.trim().replace(/^(\?|#|&)/, '');

	if (!str) {
		return {};
	}

	return str.split('&').reduce(function (ret, param) {
		var parts = param.replace(/\+/g, ' ').split('=');
		// Firefox (pre 40) decodes `%3D` to `=`
		// https://github.com/sindresorhus/query-string/pull/37
		var key = parts.shift();
		var val = parts.length > 0 ? parts.join('=') : undefined;

		key = decodeURIComponent(key);

		// missing `=` should be `null`:
		// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
		val = val === undefined ? null : decodeURIComponent(val);

		if (!ret.hasOwnProperty(key)) {
			ret[key] = val;
		} else if (Array.isArray(ret[key])) {
			ret[key].push(val);
		} else {
			ret[key] = [ret[key], val];
		}

		return ret;
	}, {});
};

exports.stringify = function (obj) {
	return obj ? Object.keys(obj).sort().map(function (key) {
		var val = obj[key];

		if (val === undefined) {
			return '';
		}

		if (val === null) {
			return key;
		}

		if (Array.isArray(val)) {
			return val.sort().map(function (val2) {
				return strictUriEncode(key) + '=' + strictUriEncode(val2);
			}).join('&');
		}

		return strictUriEncode(key) + '=' + strictUriEncode(val);
	}).filter(function (x) {
		return x.length > 0;
	}).join('&') : '';
};

},{"strict-uri-encode":6}],6:[function(require,module,exports){
'use strict';
module.exports = function (str) {
	return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
		return '%' + c.charCodeAt(0).toString(16).toUpperCase();
	});
};

},{}],7:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = extend;
function extend(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || typeof add !== 'object') return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
}

},{}]},{},[1]);
