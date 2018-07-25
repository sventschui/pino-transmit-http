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
    const success = window.navigator.sendBeacon(opts.url, data) // use sendBeacon
    if (success) {
      return Promise.resolve()
    } else {
      return Promise.reject(new Error('sendBeacon failed'))
    }
  }

  // otherwise use XMLHttpRequest primarely as it allows for async = false in case of a flush
  if (!opts.fetch && typeof XMLHttpRequest !== 'undefined') {
    return new Promise(function xhrPromise (resolve, reject) {
      // when window unload was triggered we will do a sync XHR
      // TODO: should provide an option to prevent this as this will heavily impact
      // perceived page switch performance
      // TODO: allow for an option to send only warn/error logs during unloading
      const async = !isUnloading

      const xhr = new global.XMLHttpRequest()

      xhr.onerror = function xhrOnError (e) {
        reject(new Error('XHR failed with error ' + e.message + ' ' + e.code + ' ' + e.name + ' ' + e))
      }

      if (async) {
        xhr.onreadystatechange = function onreadystatechange (e) {
          if (xhr.readyState === 2 /* HEADERS_RECEIVED */) {
            if (xhr.status < 200 || xhr.status > 299) {
              reject(new Error('XHR failed with status ' + xhr.status))
            } else {
              resolve()
            }
          }
        }
      }

      xhr.open(opts.method, opts.url, async)

      const headers = opts.headers || defaultHeaders
      Object.keys(headers).forEach(name => {
        xhr.setRequestHeader(name, headers[name])
      })

      xhr.send(data)

      if (!async) {
        return resolve()
      }
    })
  }

  // last resort is to use global fetch or a passed in fetch function
  if (opts.fetch || typeof fetch !== 'undefined') {
    if (isUnloading) {
      console.warn('pino-transmit-http: Tried to send logs during page unloading when XMLHttpRequest is not available. The log entries will most likely never arrive!')
    }

    const fetchFn = opts.fetch || global.fetch

    return fetchFn(opts.url, {
      method: opts.method,
      headers: opts.headers || defaultHeaders,
      body: data
    })
      .then(function onFetchComplete (response) {
        if (!response.ok) {
          return Promise.reject(new Error('Fetch response was not okay. Status: ' + response.status))
        }
      })
  }

  return Promise.reject(new Error('Neither XMLHttpRequest nor fetch are available'))
}
