'use strict'

const test = require('tap').test
const fakeEnv = require('./fake-env')

test('fetch no sendBeacon', function (t) {
  t.plan(19)

  const pino = require('pino/browser')
  const transmitFn = require('../')
  const env = fakeEnv(t, { sendBeacon: false, fetch: true })

  const transmit = transmitFn()
  t.is(env.unloadEventListeners.length, 1)

  const logger = pino({ browser: { transmit } })

  logger.info('hello one')
  logger.error('hello two')
  t.is(env.xhrs.length, 0, 'Expect no XHR calls to be made immediately after log statements')
  t.is(env.fetchCalls.length, 0, 'Expect no fetch calls to be made immediately after log statements')
  t.is(env.sendBeaconCalls.length, 0, 'Expect no sendBeacon calls to be made immediately after log statements')

  setTimeout(() => {
    t.is(env.xhrs.length, 0, 'Expect no XHR calls to be made after 1.1 seconds')
    t.is(env.fetchCalls.length, 1, 'Expect one fetch call to be made after 1.1 seconds')
    t.is(env.fetchCalls[0].url, '/log', 'Expect XHR to request URL /log')
    t.is(env.fetchCalls[0].options.method, 'POST', 'Expect XHR to be POST')
    t.ok(
      env.fetchCalls[0].options.body.match(
        /\[{"ts":[0-9]{13},"messages":\["hello one"],"bindings":\[],"level":{"label":"info","value":30}},{"ts":[0-9]{13},"messages":\["hello two"],"bindings":\[],"level":{"label":"error","value":50}}]/
      ),
      'Expect fetch to send correct data'
    )
    t.is(env.sendBeaconCalls.length, 0, 'Expect no sendBeacon calls to be made')

    logger.warn('hello three')
    t.is(env.xhrs.length, 0, 'Expect no XHR calls to be made immediately after third log statement')
    t.is(env.fetchCalls.length, 1, 'Expect no further fetch calls to be made immediately after third log statement')
    t.is(env.sendBeaconCalls.length, 0, 'Expect no sendBeacon calls to be made immediately after log statements')

    env.unload()

    t.is(env.xhrs.length, 0, 'Expect no XHR calls to be made immediately after unload')
    t.is(env.fetchCalls.length, 2, 'Expect one more fetch call to be made immediately after unload')
    t.is(env.sendBeaconCalls.length, 0, 'Expect no sendBeacon calls to be made immediately after unload')
    t.is(env.fetchCalls[1].url, '/log', 'Expect XHR to request URL /log')
    t.is(env.fetchCalls[1].options.method, 'POST', 'Expect XHR to be POST')
    t.ok(
      env.fetchCalls[1].options.body.match(
        /\[{"ts":[0-9]{13},"messages":\["hello three"],"bindings":\[],"level":{"label":"warn","value":40}}]/
      ),
      'Expect fetch to send correct data'
    )

    t.end()
  }, 1100)
})
