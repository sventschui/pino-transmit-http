# pino-transmit-http [![Build Status](https://travis-ci.org/sventschui/pino-transmit-http.svg?branch=master)](https://travis-ci.org/sventschui/pino-transmit-http) [![Coverage Status](https://coveralls.io/repos/github/sventschui/pino-transmit-http/badge.svg?branch=master)](https://coveralls.io/github/sventschui/pino-transmit-http?branch=master)

> ATTENTION: draft version, not yet released!

**Lead maintainer:** [Sven Tschui](https://github.com/sventschui)

This is a browser transmit for the [Pino](https://github.com/pinojs/pino) logger
that sends log statements created in a browser environment to a remote server using
HTTP calls (XHR, fetch or sendBeacon depending on availability).

You can use it like so:

```sh
$ npm install pino pino-transmit-http
```

```js
const pino = require('pino');
const pinoTransmitHttp = require('pino-transmit-http');

const logger = pino({
  browser: {
    trasmit: pinoTransmitHttp()
  }
})

logger.warn('hello pino')
```

A HTTP request will by default look like this

```json
POST /log
Content-Type: application/json;charset=UTF-8

[{"ts":1531919330334,"messages":["hello pino"],"bindings":[],"level":{"label":"warn","value":40}}]
```

Options that can be passed to `pinoTransmitHttp({ ... })`:

key | default | description
--- | --- | ---
throttle | `500` | Amount of milliseconds to throttle the transmission of the log messages. Note that `trailing = true, leading = false` is used. See [lodash.throttle](https://lodash.com/docs#throttle)
debounce | `null` | Amount of milliseconds to debounce the transmission of the log messages. See [lodash.debounce](https://lodash.com/docs#debounce). If null then throttling is used
url | `'/log'` | location where to send logs
useSendBeacon | `true` | whether `navigator.sendBeacon` should be used on `unload`
method | `'POST'` | method to be used by XHR and fetch calls
headers | `{ 'content-type': 'application/json;charset=UTF-8' }` | headers added to XHR and fetch calls. Default includes content-type header
fetch | `null` | fetch instance to be used instead of the global fetch variable
