// babel.config.js

const { framework } = require('../lib/options')

module.exports = api => {
  api && api.cache(true)
  const config = {
    presets: [
      [
        '@babel/preset-typescript',
        {
          allExtensions: true,
          isTSX: true
        }
      ],
      [
        '@babel/preset-env',
        {
          corejs: require('core-js/package.json').version,
          useBuiltIns: 'usage'
        }
      ]
    ],
    plugins: ['@babel/plugin-transform-runtime']
  }
  if (framework === 'react') {
    Object.assign(config, {
      env: {
        development: {
          presets: [['@babel/preset-react', { development: true }]],
          plugins: ['react-refresh/babel']
        },
        production: {
          presets: ['@babel/preset-react'],
          plugins: [
            '@babel/plugin-transform-react-constant-elements',
            '@babel/plugin-transform-react-inline-elements'
          ]
        }
      }
    })
  }
  return config
}
