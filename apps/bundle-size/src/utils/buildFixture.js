const { default: chalk } = require('chalk');
const gzipSize = require('gzip-size');
const fs = require('fs-extra');
const path = require('path');
const { minify } = require('terser');
const webpack = require('webpack');
const { bytesToKb } = require('./helpers');

const { hrToSeconds } = require('./helpers');

/**
 * @param {string} fixturePath
 * @param {string} outputPath
 *
 * @return {import("webpack").Configuration}
 */
function createWebpackConfig(fixturePath, outputPath) {
  return {
    name: 'client',
    target: 'web',
    mode: 'production',

    cache: {
      type: 'memory',
    },
    externals: {
      react: 'react',
      'react-dom': 'reactDOM',
    },

    entry: fixturePath,
    output: {
      filename: path.basename(outputPath),
      path: path.dirname(outputPath),

      pathinfo: true,
    },
    performance: {
      hints: false,
    },
    optimization: {
      minimize: false,
    },
    stats: {
      optimizationBailout: true,
    },
  };
}

/**
 * @param {import("webpack").Configuration} webpackConfig
 * @return {Promise<null>}
 */
function webpackAsync(webpackConfig) {
  return new Promise((resolve, reject) => {
    const compiler = webpack(webpackConfig);

    compiler.run(err => {
      if (err) {
        reject(err);
      }

      resolve(null);
    });
  });
}

// ---

/**
 * @typedef {{ path: string, name: string, threshold: null | number }} PreparedFixture
 *
 * @param {PreparedFixture} preparedFixture
 * @param {boolean} verbose
 *
 * @return {Promise<PreparedFixture & { minifiedSize: string, gzippedSize: string }>}
 */
module.exports = async function processFixture(preparedFixture, verbose) {
  const webpackStartTime = process.hrtime();

  const webpackOutputPath = preparedFixture.path.replace(/.fixture.js$/, '.output.js');
  const config = createWebpackConfig(preparedFixture.path, webpackOutputPath);

  await webpackAsync(config);

  if (verbose) {
    console.log(
      [
        chalk.blue('[i]'),
        `"${path.basename(preparedFixture.path)}": Webpack in ${hrToSeconds(process.hrtime(webpackStartTime))}`,
      ].join(' '),
    );
  }

  // ---

  const terserStartTime = process.hrtime();
  const terserOutputPath = preparedFixture.path.replace(/.fixture.js$/, '.min.js');

  const webpackOutput = (await fs.promises.readFile(webpackOutputPath)).toString();

  const [terserOutput, terserOutputMinified] = await Promise.all([
    // Performs only dead-code elimination
    minify(webpackOutput, {
      mangle: false,
      output: {
        beautify: true,
        comments: true,
        preserve_annotations: true,
      },
    }),
    minify(webpackOutput, {
      output: {
        comments: false,
      },
    }),
  ]);

  await fs.promises.writeFile(webpackOutputPath, terserOutput.code);
  await fs.promises.writeFile(terserOutputPath, terserOutputMinified.code);

  if (verbose) {
    console.log(
      [
        chalk.blue('[i]'),
        `"${path.basename(preparedFixture.path)}": Terser in ${hrToSeconds(process.hrtime(terserStartTime))}`,
      ].join(' '),
    );
  }

  const minifiedSize = bytesToKb((await fs.promises.stat(terserOutputPath)).size);
  const gzippedSize = bytesToKb(await gzipSize.file(terserOutputPath));

  return {
    /* TODO: 👇 normalize paths */
    ...preparedFixture,

    minifiedSize,
    gzippedSize,
  };
};
