
const common = require('./webpack.common')

module.exports = {
    ...common.default,
    entry: "./src/index.ts",
    output: {
        filename: 'bundle.js'
    },
    mode: "development",
    devServer: {
        devMiddleware: {
            publicPath: "/dist",
        },
    },
    plugins: [
    ],
};