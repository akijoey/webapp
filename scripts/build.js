const webpack = require('webpack')

process.env.NODE_ENV = 'production'
const config = require('../config/webpack.config')

function build() {
  const compiler = webpack(config)
  compiler.run((error, stats) => {
    if (error) {
      console.error(error.stack || error)
      if (error.details) {
        console.error(error.details)
      }
      return
    }
    const info = stats.toString(config.stats)
    console.log(info)
  })
}

if (require.main === module) {
  build()
}
