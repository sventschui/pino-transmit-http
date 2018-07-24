'use strict'

const createMockFetch = require('./create-mock-fetch')
const mockConsole = require('./mock-console')

module.exports = function fakeEnv (t, opts) {
  const xhrs = []
  const unloadEventListeners = []
  const sendBeaconCalls = []
  let fetchCalls = []

  global.window = global

  global.addEventListener = function addEventListener (e, fn) {
    if (e === 'unload') {
      unloadEventListeners.push(fn)
    } else {
      t.fail(`Didn't expect to register an event listener for event of type ${e}`)
    }
  }

  global.navigator = {
    sendBeacon: opts.sendBeacon
      ? function fakeSendBeacon (url, data) {
        sendBeaconCalls.push({ url, data })
        return true
      }
      : undefined
  }

  if (opts.xhr) {
    global.XMLHttpRequest = function FakeXHR () {
      const fakeXhr = {
        open: null,
        send: null,
        requestHeaders: {}
      }

      xhrs.push(fakeXhr)

      this.open = function fakeOpen (method, url, async) {
        if (fakeXhr.open) {
          t.fail('Didn\'t expect send() to be called twice')
        }

        fakeXhr.open = { method, url, async }
      }

      this.send = function fakeSend (data) {
        if (fakeXhr.send) {
          t.fail('Didn\'t expect send() to be called twice')
        }

        if (this.onreadystatechange) {
          this.readyState = 1
          this.onreadystatechange()
          this.readyState = 2
          this.status = 200
          this.onreadystatechange()
          this.readyState = 3
          this.onreadystatechange()
          this.readyState = 4
          this.onreadystatechange()
        }

        fakeXhr.send = { data }
      }

      this.setRequestHeader = function fakeSetRequestHeader (name, value) {
        if (!fakeXhr.open) {
          t.fail('XHR must be opened before setRequestHeader is called')
          return
        }

        if (fakeXhr.requestHeaders[name]) {
          t.fail(`Didn't expect the ${name} header to be set twice`)
          return
        }

        fakeXhr.requestHeaders[name] = value
      }
    }
  } else {
    delete global.XMLHttpRequest
  }

  if (opts.fetch) {
    const mockFetch = createMockFetch()
    global.fetch = mockFetch.fetch
    fetchCalls = mockFetch.fetchCalls
  } else {
    delete global.fetch
  }

  const mockedConsole = mockConsole(t)

  return {
    xhrs,
    unloadEventListeners,
    sendBeaconCalls,
    fetchCalls,
    console: mockedConsole,
    unload: function unload () {
      unloadEventListeners.forEach(l => {
        l()
      })
    }
  }
}
