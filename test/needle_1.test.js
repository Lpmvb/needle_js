const test = require('ava');
const { templateMatch } = require('../index.js');
const fs = require('fs');
const path = require('path');

function readImage(filePath) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', filePath));
}

const needleScale = 1;

function readImage(filePath) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', filePath));
}

test('match template', async t => {
  const haystackBuffer = readImage('haystack.png');
  const needleBuffer = readImage('needle.png');
  const result = await templateMatch(haystackBuffer, needleBuffer, {
    scale: 1 / needleScale,
  });
  console.log(result);
  t.true(result.found);
});

