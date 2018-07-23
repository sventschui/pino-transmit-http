'use strict'

const test = require('tap').test
const mockEnv = require('./mock-env')

test('XHR', function (t) {
  t.plan(15)

  const pino = require('pino/browser')
  const transmitFn = require('../')
  const env = mockEnv(t, { sendBeacon: true, xhr: true })

  const transmit = transmitFn()
  t.is(env.unloadEventListeners.length, 1)

  const logger = pino({ browser: { transmit } })

  logger.info('hello one')
  logger.error('hello two')
  t.is(env.xhrs.length, 0, 'Expect no XHR calls to be made immediately after log statements')
  t.is(env.sendBeaconCalls.length, 0, 'Expect no sendBeacon calls to be made immediately after log statements')

  setTimeout(() => {
    t.is(env.xhrs.length, 1, 'Expect one XHR call to be made after 1.1 seconds')
    t.is(env.xhrs[0].open.method, 'POST', 'Expect XHR to be POST')
    t.is(env.xhrs[0].open.url, '/log', 'Expect XHR to request URL /log')
    t.is(env.xhrs[0].open.async, true, 'Expect XHR to be async')
    t.ok(
      env.xhrs[0].send.data.match(
        /\[{"ts":[0-9]{13},"messages":\["hello one"],"bindings":\[],"level":{"label":"info","value":30}},{"ts":[0-9]{13},"messages":\["hello two"],"bindings":\[],"level":{"label":"error","value":50}}]/
      ),
      'Expect XHR to send correct data'
    )
    t.is(env.sendBeaconCalls.length, 0, 'Expect no sendBeacon calls to be made')

    logger.warn('hello three')
    t.is(env.xhrs.length, 1, 'Expect no further XHR calls to be made immediately after third log statement')
    t.is(env.sendBeaconCalls.length, 0, 'Expect no sendBeacon calls to be made immediately after log statements')

    env.unload()

    t.is(env.xhrs.length, 1, 'Expect no further XHR calls to be made immediately after unload')
    t.is(env.sendBeaconCalls.length, 1, 'Expect sendBeacon call to be made immediately after unload')
    t.is(env.sendBeaconCalls[0].url, '/log', 'Expect sendBeacon call to use url /log')
    t.ok(
      env.sendBeaconCalls[0].data.match(
        /\[{"ts":[0-9]{13},"messages":\["hello three"],"bindings":\[],"level":{"label":"warn","value":40}}]/
      ),
      'Expect sendBeacon call to send correct data'
    )

    t.end()
  }, 1100)
})
