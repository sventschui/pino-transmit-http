'use strict'

const test = require('tap').test
const mockEnv = require('../mock-env')
const httpSend = require('../../lib/http-send')

test('xhr', function (t) {
  t.plan(5)

  const env = mockEnv(t, { sendBeacon: true, fetch: false, xhr: true })

  httpSend('test data', false, {
    url: '/log',
    method: 'POST',
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      accept: 'application/json',
      authorization: 'unicorn'
    },
    useSendBeacon: true
  })

  t.is(env.xhrs.length, 1, 'Expect one XHR call to be made')
  t.is(env.sendBeaconCalls.length, 0, 'Expect no sendBeacon calls to be made')
  t.is(env.fetchCalls.length, 0, 'Expect no fetch calls to be made')
  t.same(env.xhrs[0], {
    open: {
      async: true,
      method: 'POST',
      url: '/log'
    },
    requestHeaders: {
      'content-type': 'application/json;charset=UTF-8',
      accept: 'application/json',
      authorization: 'unicorn'
    },
    send: {
      data: 'test data'
    }
  }, 'Expect XHR call to be an async POST, have the correct body and headers')
  t.is(env.console.calls.length, 0, 'Expect no console calls to be made')

  t.end()
})

test('xhr unloading', function (t) {
  t.plan(5)

  const env = mockEnv(t, { sendBeacon: true, fetch: false, xhr: true })

  httpSend('test data sendBeacon', true, {
    url: '/log',
    method: 'POST',
    useSendBeacon: true
  })

  t.is(env.xhrs.length, 0, 'Expect no XHR calls to be made')
  t.is(env.fetchCalls.length, 0, 'Expect no global fetch fn calls to be made')
  t.is(env.sendBeaconCalls.length, 1, 'Expect one sendBeacon call to be made')
  t.same(env.sendBeaconCalls[0], {
    url: '/log',
    data: 'test data sendBeacon'
  }, 'Expect correct sendBeacon call to be made')
  t.is(env.console.calls.length, 0, 'Expected no console call')

  t.end()
})

test('xhr unloading sendBeacon incompatible', function (t) {
  t.plan(6)

  const env = mockEnv(t, { sendBeacon: true, fetch: false, xhr: true })

  httpSend('test data sendBeacon incompatible', true, {
    url: '/log',
    method: 'PUT',
    headers: {
      'content-type': 'application/xml;charset=UTF-8',
      accept: 'application/json',
      authorization: 'unicorn'
    },
    useSendBeacon: true
  })

  t.is(env.console.calls.length, 1, 'Expected two console call')
  t.same(env.console.calls[0], {
    level: 'warn',
    arguments: ['pino-transmit-http: Tried to use method %s when using sendBeacon. This is not supported!', 'PUT']
  }, 'Expected warning about method')

  t.is(env.xhrs.length, 1, 'Expect one XHR call to be made')
  t.is(env.sendBeaconCalls.length, 0, 'Expect no sendBeacon call to be made')
  t.is(env.fetchCalls.length, 0, 'Expect no fetch calls to be made')
  t.same(env.xhrs[0], {
    open: {
      async: false,
      method: 'PUT',
      url: '/log'
    },
    requestHeaders: {
      'content-type': 'application/xml;charset=UTF-8',
      accept: 'application/json',
      authorization: 'unicorn'
    },
    send: {
      data: 'test data sendBeacon incompatible'
    }
  }, 'Expect XHR call to be an sync PUT, have the correct body and headers')

  // TODO: add more tests about sendBeacon incompatibility

  t.end()
})

test('xhr unloading no sendBeacon', function (t) {
  t.plan(5)

  const env = mockEnv(t, { sendBeacon: false, fetch: false, xhr: true })

  httpSend('test data no sendBeacon', true, {
    url: '/log',
    method: 'PUT',
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      accept: 'application/json',
      authorization: 'unicorn'
    },
    useSendBeacon: true
  })

  t.is(env.xhrs.length, 1, 'Expect one XHR call to be made')
  t.is(env.sendBeaconCalls.length, 0, 'Expect no sendBeacon call to be made')
  t.is(env.fetchCalls.length, 0, 'Expect no fetch calls to be made')
  t.same(env.xhrs[0], {
    open: {
      async: false,
      method: 'PUT',
      url: '/log'
    },
    requestHeaders: {
      'content-type': 'application/json;charset=UTF-8',
      accept: 'application/json',
      authorization: 'unicorn'
    },
    send: {
      data: 'test data no sendBeacon'
    }
  }, 'Expect XHR call to be an sync PUT, have the correct body and headers')
  t.is(env.console.calls.length, 0, 'Expected no console call')

  t.end()
})
