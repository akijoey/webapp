const chalk = require('chalk')

const levels = {
  success: 'green',
  info: 'blueBright',
  warn: 'yellow',
  error: 'red'
}

const prefix = level => {
  const color = levels[level]
  const bgColor = 'bg' + color.charAt(0).toUpperCase() + color.slice(1)
  return chalk[bgColor].black('', level.toUpperCase(), '')
}

class Logger {
  constructor(options) {
    options = Object.assign(
      {
        prefix: false,
        raw: false
      },
      options
    )
    this.prefix = options.prefix
    this.raw = options.raw

    Object.keys(levels).forEach(level => {
      this[level] = message => {
        message = chalk[levels[level]](message)
        if (!this.prefix) {
          return this.raw ? message : this.log(message)
        }

        const title = prefix(level)
        if (this.raw) {
          return `${title} ${message}\n`
        }
        this.log(title, message, '\n')
      }
    })
  }

  log() {
    console.log.apply(console, arguments)
  }
}

Object.setPrototypeOf(Logger.prototype, chalk)

module.exports = Object.assign(new Logger(), { Logger })
