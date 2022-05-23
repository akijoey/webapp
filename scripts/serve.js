const http = require('http')
const { spawn } = require('child_process')

const Koa = require('koa')
const send = require('koa-send')

process.env.NODE_ENV = 'production'
const getPort = require('../lib/port')
const options = require('../lib/options')
const { logger, note } = require('../lib/logger')
const { exists, resolve } = require('../lib/path')

const project = require(resolve('package.json'))

const init = async () => {
  const availablePort = await getPort({
    host: options.host,
    from: options.port,
    to: options.port + 100
  })
  if (availablePort) {
    options.port = availablePort
  }
}

const exec = (command, argv = []) => {
  console.log(`> ${command} ${argv.join(' ')}\n`)
  return spawn(command, argv, {
    stdio: 'inherit',
    shell: true
  })
}

const loggerMiddleware = logger => {
  if (typeof logger !== 'function') {
    logger = console.log.bind(console)
  }
  return async (ctx, next) => {
    const start = Date.now()
    await next()
    const ms = Date.now() - start
    logger(note.reset(`${ctx.method} ${ctx.url} - ${ms}ms`))
  }
}

const staticMiddleware = root => {
  const methods = ['HEAD', 'GET']
  return async (ctx, next) => {
    if (methods.includes(ctx.method)) {
      await send(ctx, ctx.path, { root, index: 'index.html' })
    }
    next()
  }
}

const createServer = async () => {
  await init()
  const app = new Koa()
  app.use(loggerMiddleware(logger.info.bind(logger)))
  app.use(staticMiddleware(resolve(options.outputDir)))
  // create server
  const server = http.createServer(app.callback())
  server.listen(options.port, options.host, () => {
    logger.info(note.reset(`${project.name} - v${project.version}`))
    logger.info(
      `Server is running at ${note.blueBright.underline(
        `http://${options.host}:${options.port}`
      )}`
    )
  })
  // signal handle
  const signals = ['SIGINT', 'SIGTERM']
  signals.forEach(signal => {
    process.on(signal, () => {
      server.close()
      logger.warn('Server has been closed.')
      process.exit()
    })
  })
}

function serve() {
  const argv = process.argv.slice(2)
  if (exists('app.ts')) {
    exec('ts-node', ['app.ts', ...argv])
  } else if (exists('app.js')) {
    exec('node', ['app.js', ...argv])
  } else {
    createServer()
  }
}

if (require.main === module) {
  serve()
}
