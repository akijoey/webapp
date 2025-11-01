const Lognote = require('lognote')

const logger = new Lognote({
  preset: 'datetime'
})

const note = new Lognote({
  preset: 'background',
  raw: true
})

const newline = '\n'

module.exports = { logger, note, newline }
