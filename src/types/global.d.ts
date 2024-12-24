// src/types/global.d.ts
/// <reference types="node" />
/// <reference types="react" />
/// <reference types="react-dom" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: "development" | "production" | "test";
    readonly REACT_APP_API_BASE_URL: string;
  }
}

declare module "*.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
