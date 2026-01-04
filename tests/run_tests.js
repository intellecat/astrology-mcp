import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const unitTestsDir = path.join(__dirname, 'unit');

if (!fs.existsSync(unitTestsDir)) {
  console.error(`Test directory not found: ${unitTestsDir}`);
  process.exit(1);
}

const files = fs.readdirSync(unitTestsDir).filter(f => f.endsWith('.test.js'));

let failed = false;

console.log(`Found ${files.length} test files in ${unitTestsDir}`);

for (const file of files) {
  const filePath = path.join(unitTestsDir, file);
  console.log(`
Running ${file}...
`);
  const result = spawnSync('node', [filePath], { stdio: 'inherit' });
  if (result.status !== 0) {
    failed = true;
    console.error(`❌ ${file} failed.`);
  }
}

if (failed) {
  console.error('\n❌ Some tests failed.');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed.');
}
