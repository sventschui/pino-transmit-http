'use strict'

const useSendBeacon = require('./use-send-beacon')

const defaultHeaders = {
  'content-type': 'application/json;charset=UTF-8'
}

module.exports = function httpSend (data, isUnloading, opts) {
  // try to use navigator.sendBeacon if window.unload event was triggered
  if (isUnloading && // if we're unloading
    useSendBeacon(opts)
  ) {
    window.navigator.sendBeacon(opts.url, data) // use sendBeacon
  } else if (!opts.fetch && typeof XMLHttpRequest !== 'undefined') {
    // otherwise use XMLHttpRequest primarely as it allows for async = false in case of a flush

    // when window unload was triggered we will do a sync XHR
    // TODO: should provide an option to prevent this as this will heavily impact
    // perceived page switch performance
    // TODO: allow for an option to send only warn/error logs during unloading
    const async = !isUnloading

    const xhr = new global.XMLHttpRequest()
    xhr.open(opts.method, opts.url, async)
    const headers = opts.headers || defaultHeaders
    Object.keys(headers).forEach(name => {
      xhr.setRequestHeader(name, headers[name])
    })
    xhr.onerror = function xhrOnError (e) {
      // TODO: handle this error...
      console.error('XHR failed with error', e)
    }
    if (async) {
      xhr.onreadystatechange = function onreadystatechange (e) {
        if (xhr.readyState === 2 /* HEADERS_RECEIVED */) {
          if (xhr.status < 200 || xhr.status > 299) {
            // TODO: handle this error...
            console.error('XHR failed with status', xhr.status)
          }
        }
      }
    }
    xhr.send(data)
  } else if (opts.fetch || typeof fetch !== 'undefined') {
    if (isUnloading) {
      console.warn('Tried to send logs during page unloading when XMLHttpRequest is not available. The log entries will most likely never arrive!')
    }

    const fetchFn = opts.fetch || global.fetch

    fetchFn(opts.url, {
      method: opts.method,
      headers: opts.headers || defaultHeaders,
      body: data
    })
      .then(function onFetchComplete (response) {
        if (!response.ok) {
          // TODO: handle this error
          console.error('Fetch response was not okay. Status: %d', response.status)
        }
      })
      .catch(function onFetchError (e) {
        // TODO: handle this error
        console.error('Fetch threw error', e)
      })
  } else {
    // TODO: handle this error
    console.error('Neither XMLHttpRequest nor fetch are available')
  }
}
