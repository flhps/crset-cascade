import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

const config = [
  // ESM build
  {
    input: "src/index.ts",
    output: {
      dir: "dist/esm",
      format: "esm",
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: "src",
    },
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        outDir: "dist/esm",
      }),
      resolve({
        preferBuiltins: true,
      }),
      commonjs(),
      json(),
    ],
  },
  // CJS build
  {
    input: "src/index.ts",
    output: {
      dir: "dist/cjs",
      format: "cjs",
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: "src",
    },
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        outDir: "dist/cjs",
      }),
      resolve({
        preferBuiltins: true,
      }),
      commonjs(),
      json(),
    ],
  },
  // Types
  {
    input: "src/index.ts",
    output: {
      file: "dist/types/index.d.ts",
      format: "esm",
    },
    plugins: [
      dts({
        respectExternal: true,
        compilerOptions: {
          removeComments: false,
        },
      }),
    ],
  },
];

export default config;
