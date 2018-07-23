'use strict'

const test = require('tap').test
const mockEnv = require('../mock-env')
const createFakeFetch = require('../mock-env/create-mock-fetch')
const httpSend = require('../../lib/http-send')

test('fetch', function (t) {
  t.plan(7)

  const env = mockEnv(t, { sendBeacon: true, fetch: true, xhr: true })
  const fakeFetch = createFakeFetch()

  httpSend('test data', false, {
    fetch: fakeFetch.fetch,
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
  t.is(env.fetchCalls.length, 0, 'Expect no global fetch calls to be made')
  t.is(fakeFetch.fetchCalls.length, 1, 'Expect a custom fetch fn call to be made')
  t.is(fakeFetch.fetchCalls[0].url, '/log', 'Expect fetch call to request URL /log')
  t.same(fakeFetch.fetchCalls[0].options, {
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
