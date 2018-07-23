'use strict'

module.exports = function fakeFetch () {
  const fetchCalls = []

  function fetch (url, options) {
    fetchCalls.push({ url, options })
    return Promise.resolve({ status: 200, ok: true })
  }

  return {
    fetch,
    fetchCalls
  }
}
