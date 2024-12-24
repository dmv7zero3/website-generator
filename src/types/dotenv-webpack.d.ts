// src/types/dotenv-webpack.d.ts
declare module "dotenv-webpack" {
  import { Configuration, WebpackPluginInstance } from "webpack";

  interface DotenvWebpackOptions {
    path?: string;
    safe?: boolean | string;
    systemvars?: boolean;
    silent?: boolean;
    defaults?: boolean;
    prefix?: string;
    ignoreStub?: boolean;
  }

  class DotenvWebpack implements WebpackPluginInstance {
    constructor(options?: DotenvWebpackOptions);
    apply(compiler: any): void;
  }

  export default DotenvWebpack;
}
