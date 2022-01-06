const net = require('net')

const checkPort = options =>
  new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.on('error', reject)
    server.listen(options, () => {
      const { port } = server.address()
      server.close(() => {
        resolve(port)
      })
    })
  })

async function getPort(options = { port: 0 }) {
  if (options.from && options.to) {
    options.port = []
    while (options.from <= options.to) {
      options.port.push(options.from++)
    }
  }
  if (typeof options.port === 'number') {
    options.port = [options.port]
  }
  for (const port of options.port) {
    try {
      return await checkPort({ ...options, port })
    } catch (error) {
      if (!['EADDRINUSE', 'EACCES'].includes(error.code)) {
        throw error
      }
    }
  }
}

module.exports = getPort
