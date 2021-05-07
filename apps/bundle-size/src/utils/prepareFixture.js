// @ts-check

const Ajv = require('ajv');
const Babel = require('@babel/core');
const fs = require('fs-extra');
const path = require('path');

const ajv = new Ajv();

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    threshold: { type: ['number', 'null'] },
  },
  required: ['name', 'threshold'],
  additionalProperties: false,
};

/**
 * Prepares a fixture file to be compiled with Webpack, grabs data from a default export and removes it.
 *
 * @param {string} fixture
 *
 * @return {Promise<{ name: string, path: string, threshold: number | null }>}
 */
module.exports = async function prepareFixture(fixture) {
  const sourceFixturePath = path.resolve(process.cwd(), fixture);
  const sourceFixtureCode = await fs.promises.readFile(sourceFixturePath);

  const result = await Babel.transformAsync(sourceFixtureCode.toString(), {
    ast: false,
    code: true,

    babelrc: false,
    plugins: [
      {
        visitor: {
          ExportDefaultDeclaration(path, state) {
            const result = path.get('declaration').evaluate();

            if (!result.confident) {
              throw new Error();
            }

            const valid = ajv.validate(schema, result.value);

            if (!valid) {
              console.log(ajv.errors);
              throw new Error();
            }

            state.file.metadata = result.value;
            path.remove();
          },
        },
      },
    ],
  });

  if (!result || !result.metadata) {
    throw new Error();
  }

  const outputFixturePath = path.resolve(process.cwd(), 'dist', fixture);
  await fs.outputFile(outputFixturePath, result.code);

  const metadata = /** @type {unknown} */ (result.metadata);
  const { name, threshold } = /** @type {{ name: string, threshold: number | null }} */ (metadata);

  return {
    path: outputFixturePath,
    name,
    threshold,
  };
};
