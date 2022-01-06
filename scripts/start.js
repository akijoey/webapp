const http = require('http')

const Koa = require('koa')
const chalk = require('chalk')

const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')

process.env.NODE_ENV = 'development'
const getPort = require('../lib/port')
const options = require('../lib/options')

const init = async () => {
  const availablePort = await getPort({
    host: options.host,
    from: options.port,
    to: options.port + 10
  })
  if (availablePort) {
    options.port = availablePort
  }
  return require('../config/webpack.config')
}

// webpack-dev-middleware
const devMiddleware = (compiler, options) => {
  const middleware = webpackDevMiddleware(compiler, options)
  return async (ctx, next) => {
    return await middleware(
      ctx.req,
      Object.assign(ctx.res, {
        send: content => (ctx.body = content)
      }),
      next
    )
  }
}

// webpack-hot-middleware
const hotMiddleware = (compiler, options) => {
  const middleware = webpackHotMiddleware(compiler, options)
  return async (ctx, next) => {
    return await middleware(
      ctx.req,
      Object.assign(ctx.res, {
        end: () => {}
      }),
      next
    )
  }
}

async function start() {
  const app = new Koa()
  const config = await init()
  const compiler = webpack(config)
  app.use(
    devMiddleware(compiler, {
      writeToDisk: false
    })
  )
  app.use(
    hotMiddleware(compiler, {
      heartbeat: 2000,
      log: false
    })
  )
  // create server
  const server = http.createServer(app.callback())
  server.listen(options.port, options.host)
  // signal handle
  const signals = ['SIGINT', 'SIGTERM']
  signals.forEach(signal => {
    process.on(signal, () => {
      server.close()
      console.log(chalk.redBright.bold('Server has been closed'))
      process.exit()
    })
  })
}

if (require.main === module) {
  start()
}
