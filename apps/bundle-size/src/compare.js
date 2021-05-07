const { default: chalk } = require('chalk');
const Table = require('cli-table3');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');

/**
 * @typedef {{ path: string, name: string, threshold: null | number, minifiedSize: string, gzippedSize: string }} BundleSizeResult
 */

// ---

/**
 * @return BundleSizeResult[][]
 */
async function fetchSnapshotFromRemote() {
  return [
    [
      {
        path:
          'C:\\Users\\olfedias\\WebstormProjects\\office-ui-fabric-react\\packages\\react-divider\\dist\\bundle-size\\Divider.fixture.js',
        name: 'Divider',
        threshold: null,
        minifiedSize: '17.79 KB',
        gzippedSize: '5.77 KB',
      },
    ],
    [
      {
        path:
          'C:\\Users\\olfedias\\WebstormProjects\\office-ui-fabric-react\\packages\\react-image\\dist\\bundle-size\\Image.fixture.js',
        name: 'Image',
        threshold: null,
        minifiedSize: '11.44 KB',
        gzippedSize: '4.30 KB',
      },
    ],
  ];
}

/**
 *
 * @param {{ verbose: boolean }} options
 */
module.exports = async function build(options) {
  const { verbose } = options;

  const startTime = process.hrtime();

  const reports = glob.sync('packages/*/dist/bundle-size/bundle-size.json', {
    cwd: process.cwd(),
  });
  const results = /** @type BundleSizeResult[][] */ await Promise.all(
    reports.map(async reportPath => {
      return await fs.readJSON(path.resolve(process.cwd(), reportPath));
    }),
  );

  const localResult = results.reduce((acc, resultsPerPackage) => {
    resultsPerPackage.forEach(({ path, ...rest }) => {
      acc[path] = rest;
    });

    return acc;
  }, {});
  const remoteResult = await fetchSnapshotFromRemote();
  console.log(results, localResult, remoteResult);
};
