/**
 * @param {number} input
 * @return {string}
 */
function bytesToKb(input) {
  return (input / 1024).toFixed(2) + ' KB';
}

/**
 * @param {[number, number]} hrtime
 * @return {string}
 */
function hrToSeconds(hrtime) {
  let raw = hrtime[0] + hrtime[1] / 1e9;

  return raw.toFixed(2) + 's';
}

module.exports = {
  bytesToKb,
  hrToSeconds,
};
