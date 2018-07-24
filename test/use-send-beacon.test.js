'use strict'

const test = require('tap').test
const mockEnv = require('./mock-env')
const useSendBeacon = require('../lib/use-send-beacon')

test('useSendBeacon - useSendBeacon is falsw', function (t) {
  const env = mockEnv(t, {})
  delete global.window

  t.plan(2)

  t.is(useSendBeacon({ useSendBeacon: false }), false, 'should not use sendBeacon when useSendBeacon is false')
  t.is(env.console.calls.length, 0, 'expected no console calls')

  t.end()
})

test('useSendBeacon - no window', function (t) {
  const env = mockEnv(t, {})
  delete global.window

  t.plan(2)

  t.is(useSendBeacon({ useSendBeacon: true }), false, 'should not use sendBeacon when window is undefined')
  t.is(env.console.calls.length, 0, 'expected no console calls')

  t.end()
})

test('useSendBeacon - no navigator', function (t) {
  const env = mockEnv(t, {})
  delete global.window.navigator

  t.plan(2)

  t.is(useSendBeacon({ useSendBeacon: true }), false, 'should not use sendBeacon when window.navigator is undefined')
  t.is(env.console.calls.length, 0, 'expected no console calls')

  t.end()
})

test('useSendBeacon - no navigator.sendBeacon', function (t) {
  const env = mockEnv(t, {})
  delete global.window.navigator.sendBeacon

  t.plan(2)

  t.is(useSendBeacon({ useSendBeacon: true }), false, 'should not use sendBeacon when window.navigator.sendBeacon is undefined')
  t.is(env.console.calls.length, 0, 'expected no console calls')

  t.end()
})

test('useSendBeacon - invalid method', function (t) {
  const env = mockEnv(t, { sendBeacon: true })

  t.plan(3)

  t.is(useSendBeacon({ method: 'PUT', useSendBeacon: true }), false, 'should not use sendBeacon when method is PUT')
  t.is(env.console.calls.length, 1, 'expected one console calls')
  t.same(env.console.calls[0], {
    level: 'warn',
    arguments: [
      'pino-transmit-http: Tried to use method %s when using sendBeacon. This is not supported!',
      'PUT'
    ]
  }, 'expected one console calls')

  t.end()
})

test('useSendBeacon - invalid headers', function (t) {
  const env = mockEnv(t, { sendBeacon: true })

  t.plan(3)

  t.is(useSendBeacon({ method: 'POST', headers: { foo: 'bar' }, useSendBeacon: true }), false, 'should not use sendBeacon when custom headers are passed')
  t.is(env.console.calls.length, 1, 'expected one console calls')
  t.same(env.console.calls[0], {
    level: 'warn',
    arguments: [
      'pino-transmit-http: Tried to use custom headers when using sendBeacon. This is not supported!'
    ]
  }, 'expected one console calls')

  t.end()
})

test('useSendBeacon - forceSendBeacon', function (t) {
  const env = mockEnv(t, { sendBeacon: true })

  t.plan(2)

  t.is(useSendBeacon({
    method: 'PUT',
    headers: { foo: 'bar' },
    forceSendBeacon: true,
    useSendBeacon: true
  }), true, 'should use sendBeacon when method is PUT and headers are passed when forceSendBeacon=true')
  t.is(env.console.calls.length, 0, 'expected no console calls')

  t.end()
})

test('useSendBeacon - empty headers', function (t) {
  const env = mockEnv(t, { sendBeacon: true })

  t.plan(2)

  t.is(useSendBeacon({
    method: 'POST',
    headers: {},
    useSendBeacon: true
  }), true, 'should use sendBeacon when method is POST and headers are empty')
  t.is(env.console.calls.length, 0, 'expected no console calls')

  t.end()
})
