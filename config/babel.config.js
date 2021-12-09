// babel.config.js

const { framework } = require('../lib/config')

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
          corejs: 3,
          useBuiltIns: 'usage'
        }
      ]
    ],
    plugins: ['@babel/plugin-transform-runtime']
  }
  if (framework === 'react') {
    config.plugins.push([
      'babel-plugin-named-asset-import',
      {
        loaderMap: {
          svg: {
            ReactComponent: '@svgr/webpack?-svgo,+titleProp,+ref![path]'
          }
        }
      }
    ])
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
