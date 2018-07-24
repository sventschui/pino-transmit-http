const util = require('util')

module.exports = function mockConsole (t) {
  const calls = []
  const levels = ['log', 'info', 'warn', 'error']

  levels.forEach(function (level) {
    console[level] = function mockConsoleFn () {
      calls.push({
        level,
        arguments
      })
      t.comment(`${level}`, util.format.apply(util, arguments))
    }
  })

  return {
    calls
  }
}
