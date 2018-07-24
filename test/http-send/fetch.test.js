'use strict'

const test = require('tap').test
const mockEnv = require('../mock-env')
const httpSend = require('../../lib/http-send')

test('fetch', function (t) {
  t.plan(6)

  const env = mockEnv(t, { sendBeacon: true, fetch: true })

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

  t.is(env.xhrs.length, 0, 'Expect no XHR calls to be made')
  t.is(env.sendBeaconCalls.length, 0, 'Expect no sendBeacon calls to be made')
  t.is(env.fetchCalls.length, 1, 'Expect a fetch call to be made')
  t.is(env.fetchCalls[0].url, '/log', 'Expect fetch call to request URL /log')
  t.same(env.fetchCalls[0].options, {
    method: 'POST',
    body: 'test data',
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      accept: 'application/json',
      authorization: 'unicorn'
    }
  }, 'Expect fetch call to be POST, have the correct body and headers')
  t.is(env.console.calls.length, 0, 'Expect no console calls to be made')

  t.end()
})

test('fetch default headers', function (t) {
  t.plan(6)

  const env = mockEnv(t, { sendBeacon: true, fetch: true })

  httpSend('test data', false, {
    url: '/log',
    method: 'POST',
    useSendBeacon: true
  })

  t.is(env.xhrs.length, 0, 'Expect no XHR calls to be made')
  t.is(env.sendBeaconCalls.length, 0, 'Expect no sendBeacon calls to be made')
  t.is(env.fetchCalls.length, 1, 'Expect a fetch call to be made')
  t.is(env.fetchCalls[0].url, '/log', 'Expect fetch call to request URL /log')
  t.same(env.fetchCalls[0].options, {
    method: 'POST',
    body: 'test data',
    headers: {
      'content-type': 'application/json;charset=UTF-8'
    }
  }, 'Expect fetch call to be POST, have the correct body and headers')
  t.is(env.console.calls.length, 0, 'Expect no console calls to be made')

  t.end()
})

test('fetch unloading', function (t) {
  t.plan(5)

  const env = mockEnv(t, { sendBeacon: true, fetch: true, xhr: false })

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

test('fetch unloading sendBeacon incompatible', function (t) {
  t.plan(7)

  const env = mockEnv(t, { sendBeacon: true, fetch: true })

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

  t.is(env.console.calls.length, 2, 'Expected two console call')
  t.same(env.console.calls[0], {
    level: 'warn',
    arguments: ['pino-transmit-http: Tried to use method %s when using sendBeacon. This is not supported!', 'PUT']
  }, 'Expected warning about method')
  t.same(env.console.calls[1], {
    level: 'warn',
    arguments: ['pino-transmit-http: Tried to send logs during page unloading when XMLHttpRequest is not available. The log entries will most likely never arrive!']
  }, 'Expected warning about no XHR and sendBeacon available during unloading')

  t.is(env.xhrs.length, 0, 'Expect no XHR calls to be made')
  t.is(env.sendBeaconCalls.length, 0, 'Expect no sendBeacon call to be made')
  t.is(env.fetchCalls.length, 1, 'Expect one global fetch fn calls to be made')
  t.same(env.fetchCalls[0], {
    url: '/log',
    options: {
      method: 'PUT',
      body: 'test data sendBeacon incompatible',
      headers: {
        'content-type': 'application/xml;charset=UTF-8',
        accept: 'application/json',
        authorization: 'unicorn'
      }
    }
  }, 'Expect correct fetch call to be made')

  // TODO: add more tests about sendBeacon incompatibility

  t.end()
})

test('fetch unloading no sendBeacon', function (t) {
  t.plan(6)

  const env = mockEnv(t, { sendBeacon: false, fetch: true, xhr: false })

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

  t.is(env.xhrs.length, 0, 'Expect no XHR calls to be made')
  t.is(env.sendBeaconCalls.length, 0, 'Expect one sendBeacon call to be made')
  t.is(env.fetchCalls.length, 1, 'Expect one global fetch fn call to be made')
  t.same(env.fetchCalls[0], {
    url: '/log',
    options: {
      method: 'PUT',
      body: 'test data no sendBeacon',
      headers: {
        'content-type': 'application/json;charset=UTF-8',
        accept: 'application/json',
        authorization: 'unicorn'
      }
    }
  }, 'Expect correct sendBeacon call to be made')
  t.is(env.console.calls.length, 1, 'Expected one console call')
  t.same(env.console.calls[0], {
    level: 'warn',
    arguments: ['pino-transmit-http: Tried to send logs during page unloading when XMLHttpRequest is not available. The log entries will most likely never arrive!']
  }, 'Expected warning about method')

  t.end()
})
