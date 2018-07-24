'use strict'

module.exports = function useSendBeacon (opts) {
  if (!opts.useSendBeacon) {
    return false
  }

  if (typeof window === 'undefined' ||
    !window.navigator ||
    !window.navigator.sendBeacon) {
    return false
  }

  if (opts.forceSendBeacon) {
    return true
  }

  // TODO: we should provide a option to use sendBeacon regardless of test failures...
  // e.g. forceSendBeacon
  if (opts.method && opts.method !== 'POST') {
    console.warn('pino-transmit-http: Tried to use method %s when using sendBeacon. This is not supported!', opts.method)
    return false
  }

  if (opts.headers) {
    const headerNames = Object.keys(opts.headers)
    if (headerNames.length >= 1 &&
      headerNames[0].toLowerCase() !== 'content-type' &&
      opts.headers[headerNames[0]].indexOf('text/plain') !== 0) {
      console.warn('pino-transmit-http: Tried to use custom headers when using sendBeacon. This is not supported!')
      return false
    }
  }

  return true
}
