const { cosmiconfigSync } = require('cosmiconfig')

const { resolve } = require('./path')
const project = require(resolve('package.json'))

const frameworks = ['react', 'vue']
const dependencies = [
  ...Object.keys(project.dependencies),
  ...Object.keys(project.devDependencies)
]

function explor(name) {
  const explorer = cosmiconfigSync(name)
  const result = explorer.search()
  if (result) {
    return result.config
  }
}

const options = Object.assign(
  {
    host: process.env.HOST || '127.0.0.1',
    port: parseInt(process.env.PORT) || 3000,
    framework: frameworks.find(framework => {
      return dependencies.includes(framework)
    }),
    publicPath: '/',
    indexPath: 'index.html',
    outputDir: 'dist',
    scriptsDir: 'scripts',
    stylesDir: 'styles',
    assetsDir: 'assets'
  },
  explor('webapp')
)

module.exports = options
