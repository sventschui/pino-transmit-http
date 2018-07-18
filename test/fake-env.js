module.exports = function fakeEnv (t, opts) {
  const xhrs = []
  const unloadEventListeners = []
  const sendBeaconCalls = []
  const fetchCalls = []

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

  if (opts.fetch) {
    global.fetch = function fakeFetch (url, options) {
      fetchCalls.push({ url, options })
      return Promise.resolve({ status: 200 })
    }
  }

  return {
    xhrs,
    unloadEventListeners,
    sendBeaconCalls,
    fetchCalls,
    unload: function unload () {
      unloadEventListeners.forEach(l => {
        l()
      })
    }
  }
}
