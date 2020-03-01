const path = require("path");
const webpack = require("webpack");
const ManifestPlugin = require("webpack-manifest-plugin");

const DEBUG = process.env.NODE_ENV !== "production";

const plugins = [
  new webpack.DefinePlugin({
    "process.env.NODE_ENV": `"${process.env.NODE_ENV}"`,
    "process.env.PHONE_NUMBER_COUNTRY": `"${process.env.PHONE_NUMBER_COUNTRY}"`
  }),
  new webpack.ContextReplacementPlugin(
    /[\/\\]node_modules[\/\\]timezonecomplete[\/\\]/,
    path.resolve("tz-database-context"),
    {
      tzdata: "tzdata"
    }
  )
];
const jsxLoaders = [
  {
    loader: "babel-loader",
    options: {
      babelrc: false,

      // The documentatio around babelrc: false is unclear and it doesn't seem to
      // actually disable reading babelrc files, so we do this too. See:
      // https://github.com/babel/website/issues/2054
      // https://github.com/babel/babel-loader/issues/464
      babelrcRoots: "/dev/null",
      presets: [
        "@babel/react",
        [
          "@babel/preset-env",
          {
            targets: "> 2%",
            modules: false
          }
        ]
      ],
      plugins: [
        "@babel/plugin-proposal-class-properties",
        "@babel/plugin-proposal-export-default-from",
        "@babel/plugin-transform-runtime",
        [
          "babel-plugin-module-resolver",
          {
            root: ["."]
          }
        ]
      ]
    }
  }
];
const assetsDir = process.env.ASSETS_DIR;
const assetMapFile = process.env.ASSETS_MAP_FILE;
const outputFile = DEBUG ? "[name].js" : "[name].[chunkhash].js";

if (!DEBUG) {
  plugins.push(
    new ManifestPlugin({
      fileName: assetMapFile
    })
  );
} else {
  plugins.push(new webpack.HotModuleReplacementPlugin());
  jsxLoaders.unshift({ loader: "react-hot-loader/webpack" });
}

const config = {
  entry: {
    bundle: ["@babel/polyfill", "./src/client/index.jsx"]
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [{ loader: "style-loader" }, { loader: "css-loader" }]
      },
      {
        test: /\.jsx?$/,
        use: jsxLoaders,
        exclude: /(node_modules|bower_components)/
      }
    ]
  },
  resolve: {
    extensions: [".js", ".jsx", ".css", ".scss"],
    modules: ["node_modules"]
  },
  plugins,
  output: {
    filename: outputFile,
    path: path.resolve(DEBUG ? __dirname : assetsDir),
    publicPath: "/assets/",
    crossOriginLoading: "anonymous"
  }
};

if (DEBUG) {
  config.devtool = "inline-source-map";
  config.output.sourceMapFilename = `${outputFile}.map`;
  config.mode = "development";
} else {
  config.devtool = "source-map";
  config.mode = "production";
}

module.exports = config;
