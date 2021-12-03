const { spawnSync } = require('child_process')

function getPort(host, port) {
  const result = spawnSync('npx', ['get-port', '--host', host, port], {
    shell: true
  })
  return result.stdout.toString() || port
}

module.exports = {
  getPort
}
