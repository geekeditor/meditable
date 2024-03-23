const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
// const ESLintPlugin = require("eslint-webpack-plugin");
// const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

const proMode = process.env.NODE_ENV === "production";

function resolve(dir) {
  return path.join(__dirname, dir)
}
exports.default = {
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".md"],
    alias: {
      "@": resolve("../src"),
    },
    // fallback: {
    //   stream: false,
    //   assert: false,
    //   util: false,
    //   buffer: false,
    // },
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
      },
      {
        test: /\.css$/,
        use: [proMode
          ? {
              loader: MiniCssExtractPlugin.loader,
              options: {
              }
            }
          : 'style-loader', "css-loader"],
      },
      {
        test: /\.less$/,
        use: [ proMode
          ? {
              loader: MiniCssExtractPlugin.loader,
              options: {
              }
            }
          : 'style-loader', "css-loader", "less-loader"],
      },
      {
        // Match woff2 in addition to patterns like .woff?v=1.1.1.
        test: /\.(woff|ttf|svg|eot)(\?.*)?$/,
        loader: "url-loader",
        options: {
          // Limit at 50k. Above that it emits separate files
          limit: 500000,

          // url-loader sets mimetype if it's passed.
          // Without this it derives it from the file extension
          mimetype: "application/font-woff",

          // Output below fonts directory
          name: "./fonts/[name].[ext]",
        },
      },
      {
        test: /\.(?:ico|gif|png|jpg|jpeg|)$/i,
        type: "asset/resource",
      },
      {
        test: /\.md$/,
        loader: "raw-loader",
      },
    ],
  },
  plugins: [
    // new NodePolyfillPlugin(),
    // new ESLintPlugin({
    //   formatter: require("eslint-friendly-formatter"),
    // }),
  ],
};
