// webpack.config.js

const { HotModuleReplacementPlugin, BannerPlugin } = require('webpack')
const WebpackBar = require('webpackbar')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const FriendlyErrorsWebpackPlugin = require('@nuxt/friendly-errors-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CompressionWebpackPlugin = require('compression-webpack-plugin')
const TerserWebpackPlugin = require('terser-webpack-plugin')
const CssMinimizerWebpackPlugin = require('css-minimizer-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')

const { exists, resolve, resolveModule } = require('../lib/path')
const { note, newline } = require('../lib/logger')
const options = require('../lib/options')

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
          filename: `${options.assetsDir}/${asset}/[name].[contenthash][ext]`
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
    publicPath: options.publicPath,
    path: resolve(options.outputDir),
    filename: `${options.scriptsDir}/[name].[contenthash].js`,
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
      options.framework === 'vue' && {
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
        }[options.framework] || 'green'
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          globOptions: {
            ignore: ['**/index.ejs']
          },
          context: resolve('public'),
          from: '*',
          to: resolve(options.outputDir),
          toType: 'dir'
        }
      ]
    }),
    new HtmlWebpackPlugin({
      title: project.name,
      filename: options.indexPath,
      template: resolve('public/index.ejs'),
      templateParameters: {
        PUBLIC_URL: options.publicPath.replace(/\/$/, ''),
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
            note.info(
              `Application is running at ${note.underline(
                `http://${options.host}:${options.port}`
              )}${newline}`
            ),
          env === 'production' &&
            note.info(
              `Application has been compiled to ${note.underline(
                `./${options.outputDir}`
              )}${newline}`
            )
        ].filter(Boolean)
      }
    }),
    options.framework === 'vue' &&
      new (require('vue-loader').VueLoaderPlugin)(),
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
      options.framework === 'react' && new ReactRefreshWebpackPlugin()
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
      banner: `/*! @license ${project.license} (c) ${year} ${project.author} */`,
      raw: true,
      exclude: /vendors/
    }),
    new MiniCssExtractPlugin({
      filename: `${options.stylesDir}/[name].[contenthash].css`,
      chunkFilename: `${options.stylesDir}/[id].[contenthash].css`,
      ignoreOrder: false
    }),
    new CompressionWebpackPlugin()
  )
  config.optimization = {
    splitChunks: {
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'initial',
          maxInitialSize: 244000
        }
      }
    },
    minimizer: [
      new TerserWebpackPlugin({
        minify: TerserWebpackPlugin.esbuildMinify,
        extractComments: false
      }),
      new CssMinimizerWebpackPlugin({
        minify: CssMinimizerWebpackPlugin.esbuildMinify
      })
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
