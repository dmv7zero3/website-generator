// webpack/webpack.dev.ts
import path from "path";
import { fileURLToPath } from "url";
import { merge } from "webpack-merge";
import type { Configuration as WebpackConfiguration } from "webpack";
import type { Configuration as WebpackDevServerConfiguration } from "webpack-dev-server";
import commonConfig from "./webpack.common.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DevServerConfiguration extends WebpackConfiguration {
  devServer?: WebpackDevServerConfiguration;
}

const config: DevServerConfiguration = merge(commonConfig, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true,
  },
});

export default config;
