'use strict'

var test = require('tap').test

function fakeEnv (t, opts) {
  const xhrs = []
  const unloadEventListeners = []
  const sendBeaconCalls = []

  global.window = {
    addEventListener: function addEventListener (e, fn) {
      if (e === 'unload') {
        unloadEventListeners.push(fn)
      } else {
        t.fail(`Didn't expect to register an event listener for event of type ${e}`)
      }
    },
    navigator: {
      sendBeacon: opts.sendBeacon
        ? function fakeSendBeacon (url, data) {
          sendBeaconCalls.push({ url, data })
          return true
        }
        : undefined
    }
  }

  if (opts.xhr) {
    global.XMLHttpRequest = function FakeXHR () {
      const fakeXhr = {
        open: null,
        send: null,
        requestHeaders: {}
      }

      xhrs.push(fakeXhr)

      return {
        open: function fakeOpen (method, url, async) {
          if (fakeXhr.open) {
            t.fail('Didn\'t expect send() to be called twice')
          }

          fakeXhr.open = { method, url, async }
        },
        send: function fakeSend (data) {
          if (fakeXhr.send) {
            t.fail('Didn\'t expect send() to be called twice')
          }

          fakeXhr.send = { data }
        },
        setRequestHeader: function fakeSetRequestHeader (name, value) {
          fakeXhr.requestHeaders[name] = value
        }
      }
    }
  }

  return {
    xhrs,
    unloadEventListeners,
    sendBeaconCalls,
    unload: function unload () {
      unloadEventListeners.forEach(l => {
        l()
      })
    }
  }
}

test('transmit works', function (t) {
  t.plan(15)

  const pino = require('pino/browser')
  const transmitFn = require('../')
  const env = fakeEnv(t, { sendBeacon: true, xhr: true })

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
        /\[{"ts":[0-9]{13},"messages":\["hello three"],"bindings":\[],"level":{"label":"warn","value":40}}]/,
      ),
      'Expect sendBeacon call to send correct data'
    )

    t.end()
  }, 1100)
})
