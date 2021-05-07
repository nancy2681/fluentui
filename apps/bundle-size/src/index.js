const compare = require('./compare');
const build = require('./build');

require('yargs')
  .command(
    'build',
    'performs build of stories',
    () => {},
    async argv => {
      await build({ verbose: /** @type {boolean} */ (argv.verbose) });
    },
  )
  .command(
    'compare',
    'compares local results with results from the storage',
    () => {},
    async argv => {
      await compare({ verbose: /** @type {boolean} */ (argv.verbose) });
    },
  )

  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging',
    default: false,
  }).argv;
