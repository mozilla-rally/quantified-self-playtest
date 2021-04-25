/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import fs from "fs";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import resolve from "@rollup/plugin-node-resolve";
import glob from "glob";
import { terser } from "rollup-plugin-terser";

import generateBackgroundScript from "./lib/generate-background-script";

import config from "./src/app.config.js";

/**
  * Helper to detect developer mode.
  *
  * @param cliArgs the command line arguments.
  * @return {Boolean} whether or not developer mode is enabled.
  */
function isDevMode(cliArgs) {
  return Boolean(cliArgs["config-enable-developer-mode"]);
}


/** Generate the intermediate background script into dist, and then read that into rollup. */
const backgroundScript = generateBackgroundScript(config);
fs.writeFileSync('dist/intermediate-background.js', backgroundScript);

export default (cliArgs) => {
  const collectors = config
    .map(collector => {
      const inputs = glob.sync(`${collector.src}*.collector.js`);
      return inputs.map(input => {
        const destination = input.split('/').slice(-1)[0];
          return {
            input, //`src/${collector}`,
            output: {
              file: `dist/content-scripts/${destination}`,
              sourcemap: isDevMode(cliArgs) ? "inline" : false,
              format: 'iife'
            },
            plugins: [
              replace({
                // In Developer Mode, the study does not submit data and
                // gracefully handles communication errors with the Core
                // Add-on.
                __ENABLE_DEVELOPER_MODE__: isDevMode(cliArgs),
              }),
              resolve({
                browser: true,
              }),
              commonjs(),
              terser()
            ],
          }
      })
    }).flat();
  return [
    // first, let's roll up the intermediate background script.
    {
      input: "dist/intermediate-background.js",
      output: {
        file: "dist/background.js",
        sourcemap: isDevMode(cliArgs) ? "inline" : false,
      },
      plugins: [
        replace({
          // In Developer Mode, the study does not submit data and
          // gracefully handles communication errors with the Core
          // Add-on.
          __ENABLE_DEVELOPER_MODE__: isDevMode(cliArgs),
        }),
        resolve({
          browser: true,
        }),
        commonjs(),
      ],
    },
    ...collectors
  ]
}
