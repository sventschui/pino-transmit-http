'use strict'

const test = require('tap').test
const mockEnv = require('./mock-env')

test('no throttle no debounce', function (t) {
  t.plan(2)

  const transmitFn = require('../')
  const env = mockEnv(t, { sendBeacon: true, xhr: true })

  transmitFn({ debounce: null, throttle: null })

  t.is(env.console.calls.length, 1, 'Expect one console call')
  t.same(env.console.calls[0], {
    level: 'warn',
    arguments: [
      'pino-transmit-http: Either throttle or debounce option must be passed to pino-transmit-http. Falling back to throttle by %dms',
      500
    ]
  }, 'Expect warn about neither throttle nor debounce')
  t.end()
})
