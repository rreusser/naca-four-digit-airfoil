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
  if (typeof nacaCode !== 'string') {
    throw new Error('NACA airfoil code must be a string. Received ' + typeof nacaCode)
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
    t: t
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
    camberLineSlope: function (x) {
      return camberLineSlope(x, c, params.m, params.p)
    },
    leadingEdgeRadius: function () {
      return leadingEdgeRadius(params.t, c)
    },
    xLower: function (x) {
      return xLower(x, c, params.m, params.p, params.t)
    },
    xUpper: function (x) {
      return xUpper(x, c, params.m, params.p, params.t)
    },
    yLower: function (x) {
      return yLower(x, c, params.m, params.p, params.t)
    },
    yUpper: function (x) {
      return yUpper(x, c, params.m, params.p, params.t)
    },
    evaluate: function (x) {
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
    return m * x / (p * p) * (2 * p - x / c)
  } else {
    p1 = 1 - p
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

function xLower (x, c, m, p, t) {
  var yt = thickness(x, c, t)
  var dycdx = camberLineSlope(x, c, m, p)
  var dscdx = Math.sqrt(1 + dycdx * dycdx)
  var stheta = dycdx / dscdx
  return x + 0.5 * yt * stheta
}

function xUpper (x, c, m, p, t) {
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
