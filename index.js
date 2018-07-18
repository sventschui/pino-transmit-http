'use strict'

const throttle = require('lodash.throttle')
const debounce = require('lodash.debounce')

const defaultOptions = {
  throttle: 500,
  debounce: null,
  url: '/log',
  useSendBeacon: true,
  method: 'POST',
  headers: { 'content-type': 'application/json;charset=UTF-8' },
  fetch: null
}

function transmitHttp (inOpts) {
  const opts = Object.assign({}, defaultOptions, inOpts)

  let collection = []
  let isUnloading = false

  function rawSend () {
    // short circuit if the method is called without any logs collected
    if (collection.length === 0) {
      return
    }

    // convert collected logs to string and clear the collector array
    let data = JSON.stringify(collection)
    collection = []

    // try to use navigator.sendBeacon if window.unload event was triggered
    if (!isUnloading ||
      !opts.useSendBeacon ||
      typeof window === 'undefined' ||
      !window.navigator.sendBeacon ||
      !window.navigator.sendBeacon(opts.url, data)
    ) {
      // otherwise use XMLHttpRequest primarely as it allows for async = false in case of a flush
      if (typeof XMLHttpRequest !== 'undefined') {
        // when window unload was triggered we will do a sync XHR
        // TODO: should provide an option to prevent this as this will heavily impact
        // perceived page switch performance
        // TODO: allow for an option to send only warn/error logs during unloading
        const async = !isUnloading

        const xhr = new global.XMLHttpRequest()
        xhr.open(opts.method, opts.url, async)
        Object.keys(opts.headers).forEach(name => {
          xhr.setRequestHeader(name, opts.headers[name])
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
          headers: opts.headers
        })
          .then(function onFetchComplete (response) {
            if (!response.ok) {
              // TODO: handle this error
              console.error('Fetch response was not okay. Status: ', response.status)
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
  }

  let send

  if (opts.debounce !== null && opts.debounce !== undefined) {
    send = debounce(rawSend, opts.debounce)
  } else if (opts.throttle !== null && opts.debounce !== undefined) {
    send = throttle(rawSend, opts.throttle, { trailing: true, leading: false })
  } else {
    console.error(`Either throttle or debounce option must be passed to pino-transmit-http. Falling back to throttle by ${defaultOptions.throttle}ms`)
    send = throttle(rawSend, defaultOptions.throttle, { trailing: true, leading: false })
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('unload', function onUnload () {
      isUnloading = true // request the rawSend method to send logs synchroneously
      const oldSend = send
      send = rawSend // directly send new incoming logs

      if (typeof oldSend.flush === 'function') {
        oldSend.flush()
      }
    })
  }

  return {
    level: opts.level,
    send: function (level, logEvent) {
      collection.push(logEvent)
      send()
    }
  }
};

module.exports = transmitHttp
