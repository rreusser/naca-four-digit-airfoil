/* global it, describe */
'use strict'

var naca = require('../')
var assert = require('chai').assert
var ae = require('almost-equal')

assert.almostEqual = function almostEqual (a, b, epsilon) {
  var eps = epsilon === undefined ? ae.DBL_EPSILON : epsilon
  assert(ae(a, b, eps, eps), 'expected ' + a + ' to equal ' + b)
}

describe('naca-four-digit-airfoil', function () {
  it('throws an error if input not a string', function () {
    assert.throws(function () {
      naca.parse(2412)
    }, Error, /must be a string/)
  })

  it('throws an error on bad NACA code', function () {
    assert.throws(function () {
      naca.parse('asdf')
    }, Error, /expected a string containing/)
  })

  describe('0012 airfoil', function () {
    var airfoil = naca('0012')

    it('parses the airfoil code', function () {
      assert.deepEqual(naca.parse('0012'), {
        m: 0.0,
        p: 0.0,
        t: 0.12
      })
    })

    it('is closed at the leading edge', function () {
      assert.almostEqual(airfoil.thickness(0), 0)
    })

    it('is (almost) closed at the trailing edge', function () {
      assert.almostEqual(airfoil.thickness(1), 0.00126 * 2)
    })

    it('has maximum thickness at 30% chord', function () {
      assert.almostEqual(airfoil.thickness(0.3), 0.12, 1e-4)
    })

    it('has no camber', function () {
      assert.almostEqual(airfoil.camberLine(0.5), 0, 1e-4)
      assert.almostEqual(airfoil.camberLineSlope(0.5), 0, 1e-4)
    })

    it('has the correct coordinates at the leading edge', function () {
      var coords = airfoil.evaluate(0)
      assert.almostEqual(coords[0], 0)
      assert.almostEqual(coords[1], 0)
      assert.almostEqual(coords[2], 0)
      assert.almostEqual(coords[3], 0)
    })

    it('has the correct coordinates at the trailing edge', function () {
      var coords = airfoil.evaluate(1)
      assert.almostEqual(coords[0], 1, 1e-4)
      assert.almostEqual(coords[1], 0.00126, 1e-6)
      assert.almostEqual(coords[2], 1, 1e-4)
      assert.almostEqual(coords[3], -0.00126, 1e-6)
    })
  })

  describe('2412 airfoil', function () {
    var airfoil = naca('2412')

    it('parses the airfoil code', function () {
      assert.deepEqual(naca.parse('2412'), {
        m: 0.02,
        p: 0.4,
        t: 0.12
      })
    })

    it('is closed at the leading edge', function () {
      assert.almostEqual(airfoil.thickness(0), 0)
    })

    it('is (almost) closed at the trailing edge', function () {
      assert.almostEqual(airfoil.thickness(1), 0.00126 * 2)
    })

    it('has maximum thickness at 30% chord', function () {
      assert.almostEqual(airfoil.thickness(0.3), 0.12, 1e-4)
    })

    it('has zero camber at leading edge', function () {
      assert.almostEqual(airfoil.camberLine(0.0), 0.0, 1e-4)
    })

    it('has zero camber at trailing edge', function () {
      assert.almostEqual(airfoil.camberLine(0.0), 0.0, 1e-4)
    })

    it('has maximum camber at 40% chord', function () {
      assert.almostEqual(airfoil.camberLine(0.4), 0.02, 1e-4)
    })

    it('has zero camber slope at 40% chord', function () {
      assert.almostEqual(airfoil.camberLineSlope(0.4), 0, 1e-4)
    })

    it('has the correct coordinates at the leading edge', function () {
      var coords = airfoil.evaluate(0)
      assert.almostEqual(coords[0], 0)
      assert.almostEqual(coords[1], 0)
      assert.almostEqual(coords[2], 0)
      assert.almostEqual(coords[3], 0)
    })

    it('has the correct coordinates at the trailing edge', function () {
      var coords = airfoil.evaluate(1)
      assert.almostEqual(coords[0], 1, 1e-4)
      assert.almostEqual(coords[1], 0.001257, 1e-6)
      assert.almostEqual(coords[2], 1, 1e-4)
      assert.almostEqual(coords[3], -0.001257, 1e-6)
    })

    it('evaluates individual coordinates', function () {
      var x = 0.1
      assert.deepEqual(airfoil.evaluate(x), [
        airfoil.xUpper(x),
        airfoil.yUpper(x),
        airfoil.xLower(x),
        airfoil.yLower(x)
      ])
    })
  })
})
