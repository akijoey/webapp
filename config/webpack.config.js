// webpack.config.js

const { HotModuleReplacementPlugin, BannerPlugin } = require('webpack')
const WebpackBar = require('webpackbar')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CompressionWebpackPlugin = require('compression-webpack-plugin')
const TerserWebpackPlugin = require('terser-webpack-plugin')
const CssMinimizerWebpackPlugin = require('css-minimizer-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const { VueLoaderPlugin } = require('vue-loader')
const chalk = require('chalk')

const { exists, resolve, resolveModule } = require('../lib/path')
const webapp = require('../lib/config')

const env = process.env.NODE_ENV
const project = require(resolve('package.json'))

const getBabelConfig = require('./babel.config')
const getPostcssConfig = require('./postcss.config')

// get style loaders
const getStyleLoaders = (style, modules = false) => {
  return [
    env === 'development' && 'style-loader',
    env === 'production' && MiniCssExtractPlugin.loader,
    {
      loader: 'css-loader',
      options: {
        importLoaders: style === 'css' ? 1 : 2,
        modules
      }
    },
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: getPostcssConfig()
      }
    },
    style !== 'css' && `${style}-loader`
  ].filter(Boolean)
}

// get style rule
const getStyleRule = (style, regexp) => {
  const ext = regexp.toString().slice(1, -1)
  return {
    oneOf: [
      {
        test: regexp,
        use: getStyleLoaders(style)
      },
      {
        test: new RegExp(`\\.module${ext}`),
        use: getStyleLoaders(style, true)
      }
    ]
  }
}

// get asset rule
const getAssetRule = (asset, regexp) => {
  return {
    test: regexp,
    oneOf: [
      {
        resourceQuery: /custom/,
        type: 'javascript/auto'
      },
      {
        type: 'asset',
        generator: {
          filename: `${webapp.assetsDir}/${asset}/[name].[contenthash][ext]`
        }
      }
    ]
  }
}

// common config
const config = {
  mode: env,
  context: process.cwd(),
  entry: [resolveModule('src/index')],
  output: {
    publicPath: webapp.publicPath,
    path: resolve(webapp.outputDir),
    filename: `${webapp.scriptsDir}/[name].[contenthash].js`,
    hashSalt: project.name,
    clean: true
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json'],
    alias: {
      '@': resolve('src')
    }
  },
  module: {
    strictExportPresence: true,
    rules: [
      webapp.framework === 'vue' && {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.(tsx?|js)$/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
          ...getBabelConfig()
        },
        exclude: /node_modules/
      },
      getStyleRule('css', /\.css$/),
      getStyleRule('sass', /\.s[ac]ss$/),
      getStyleRule('less', /\.less$/),
      getStyleRule('stylus', /\.styl$/),
      getAssetRule('images', /\.(png|jpe?g|webp|avif|gif|bmp|svg)$/),
      getAssetRule('audios', /\.(mp4|webm|ogg)$/),
      getAssetRule('vedios', /\.(mp3|aac|flac|wav)$/),
      getAssetRule('fonts', /\.(ttf|otf|woff2?|eot)$/)
    ].filter(Boolean)
  },
  plugins: [
    new WebpackBar({
      name: project.name,
      color:
        {
          react: '#61dafb', // react blue
          vue: '#41b883' // vue green
        }[webapp.framework] || 'green'
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          globOptions: {
            ignore: ['**/index.ejs']
          },
          context: resolve('public'),
          from: '*',
          to: resolve(webapp.outputDir),
          toType: 'dir'
        }
      ]
    }),
    new HtmlWebpackPlugin({
      filename: webapp.indexPath,
      template: resolve('public/index.ejs'),
      templateParameters: {
        PUBLIC_URL: webapp.publicPath.replace(/\/$/, ''),
        DOCUMENT_TITLEL: project.name
      },
      minify: env === 'production' && {
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        collapseInlineTagWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        minifyCSS: true,
        minifyJS: true,
        minifyURLs: true,
        useShortDoctype: true
      }
    }),
    new FriendlyErrorsWebpackPlugin({
      compilationSuccessInfo: {
        messages: [
          env === 'development' &&
            `Application is running at ${chalk.blueBright.underline(
              `http://${webapp.host}:${webapp.port}`
            )}`,
          env === 'production' &&
            `Application has been compiled to ${chalk.blueBright.underline(
              './dist\n'
            )}`
        ].filter(Boolean)
      }
    }),
    webapp.framework === 'vue' && new VueLoaderPlugin(),
    exists('tsconfig.json') &&
      new ForkTsCheckerWebpackPlugin({
        typescript: {
          configFile: resolve('tsconfig.json')
        }
      })
  ].filter(Boolean)
}

// development mode
if (env === 'development') {
  config.entry.unshift(
    `webpack-hot-middleware/client?${new URLSearchParams({
      reload: true,
      overlay: true
    }).toString()}`
  )
  config.plugins.push(
    ...[
      new HotModuleReplacementPlugin(),
      webapp.framework === 'react' && new ReactRefreshWebpackPlugin()
    ].filter(Boolean)
  )
  Object.assign(config, {
    devtool: 'eval-source-map',
    stats: 'summary'
  })
}

// production mode
if (env === 'production') {
  const year = new Date().getFullYear()
  config.plugins.push(
    new BannerPlugin({
      banner: `/** @license ${project.license} (c) ${year} ${project.author} */`,
      raw: true
    }),
    new MiniCssExtractPlugin({
      filename: `${webapp.stylesDir}/[name].[contenthash].css`,
      chunkFilename: `${webapp.stylesDir}/[id].[contenthash].css`,
      ignoreOrder: false
    }),
    new CompressionWebpackPlugin()
  )
  config.optimization = {
    minimizer: [
      new TerserWebpackPlugin({ extractComments: false }),
      new CssMinimizerWebpackPlugin()
    ]
  }
  Object.assign(config, {
    stats: {
      relatedAssets: true,
      modules: false,
      warnings: false,
      errors: false,
      timings: false,
      colors: true
    }
  })
}

module.exports = config
