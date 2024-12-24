// webpack/webpack.prod.ts
import path from "path";
import { fileURLToPath } from "url";
import { merge } from "webpack-merge";
import type { Configuration } from "webpack";
import commonConfig from "./webpack.common.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: Configuration = merge(commonConfig, {
  mode: "production",
  devtool: "source-map",
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: "all",
    },
  },
});

export default config;
