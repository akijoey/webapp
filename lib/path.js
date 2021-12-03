const fs = require('fs')
const path = require('path')

const exists = path => fs.existsSync(resolve(path))

const resolve = dir => path.join(process.cwd(), dir)

const extensions = ['.js', '.ts', '.tsx']
const resolveModule = path => {
  const extension = extensions.find(extension => {
    return exists(path + extension)
  })
  return resolve(path + (extension || '.js'))
}

module.exports = {
  exists,
  resolve,
  resolveModule
}
