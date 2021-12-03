const http = require('http')

const Koa = require('koa')
const chalk = require('chalk')

const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')

process.env.NODE_ENV = 'development'
const config = require('../config/webpack.config')
const { host, port } = require('../lib/config')

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
  server.listen(parseInt(port), host)
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
