const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const pkg = require('../package.json')
const commonConfig = require('./webpack.common')

const bannerPack = new webpack.BannerPlugin({
  banner: `MEditable v${pkg.version}\n` +
  `Github: https://github.com/geekeditor/meditable\n` +
  `(c) 2023-${new Date().getFullYear()} montisan <imontisan@gmail.com>\n` +
  'Released under the MIT License.' ,
  entryOnly: true
})

const constantPack = new webpack.DefinePlugin({
  MEDITABLE_VERSION: JSON.stringify(pkg.version)
})

const proMode = process.env.NODE_ENV === 'production'

module.exports = {
  ...commonConfig.default,

  mode: proMode ? 'production' : 'development',

  entry: {
    meditable: './src/packages/umd.ts'
  },

  output: {
    filename: 'umd/meditable.js',
    path: path.resolve(__dirname, '../dist'),
    assetModuleFilename: 'assets/[hash][ext][query]',
    library: {
      name: 'MEditable',
      type: 'umd'
    },
    clean: true
  },

  plugins: [
    bannerPack,
    constantPack,
    new MiniCssExtractPlugin({
      filename: 'assets/[name].css'
    })
  ]
}
