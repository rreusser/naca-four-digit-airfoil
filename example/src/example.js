/* global location, window */
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
// function dyTodJ (dy) { return dy / ymm * h }

function draw () {
  var i, x, y, xy, r
  ctx.clearRect(0, 0, w, h)
  ctx.save()
  ctx.lineWidth = window.devicePixelRatio

  ctx.strokeStyle = '#eee'
  ctx.beginPath()
  for (i = -10; i <= 10; i++) {
    ctx.moveTo(xToI(-1), yToJ(i / 10))
    ctx.lineTo(xToI(2), yToJ(i / 10))
  }
  ctx.stroke()

  ctx.strokeStyle = '#eee'
  ctx.beginPath()
  for (i = -10; i <= 10; i++) {
    ctx.moveTo(xToI(i / 10), yToJ(-1))
    ctx.lineTo(xToI(i / 10), yToJ(1))
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
  // var y = airfoil.camberLine(r)
  var dycdx = airfoil.camberLineSlope(0)
  var theta = Math.atan(dycdx)
  var x0 = r * Math.cos(theta)
  var y0 = r * Math.sin(theta)
  ctx.arc(xToI(x0), yToJ(y0), dxTodI(r), 0, Math.PI * 2)
  ctx.stroke()
}

window.onload = function () {
  // Get the element:
  canvas = document.getElementById('canvas')

  // Create an auto-fit function:
  var fit = createFit(canvas)

  // Set the fit scale:
  fit.scale = window.devicePixelRatio
  // fit.parent = function () {
    // return [ Math.min(window.innerWidth, 800), Math.min(window.innerHeight, 300) ]
  // }

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

  // function onRaf () {
    // draw()
    // requestAnimationFrame(onRaf)
  // }
  // requestAnimationFrame(onRaf)
}
