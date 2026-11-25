import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import console from 'node:console';
import process from 'node:process';

const loadValidator = createRequire(import.meta.url);
const validator = loadValidator('gltf-validator');

async function main() {
  for (const group of ['characters', 'food', 'kit']) {
    const directory = join('assets/runtime', group);
    for (const file of readdirSync(directory).filter((name) => name.endsWith('.glb')).sort()) {
      const path = join(directory, file);
      const bytes = readFileSync(path);
      const report = await validator.validateBytes(new Uint8Array(bytes), { uri: path });
      const { numErrors, numWarnings, messages } = report.issues;
      console.log(JSON.stringify({
        path, bytes: bytes.length, triangles: report.info.totalTriangleCount,
        animations: report.info.animationCount, errors: numErrors, warnings: numWarnings,
        issues: messages.filter(({ severity }) => severity <= 1).map(({ code, pointer }) => [code, pointer]),
      }));
      if (numErrors) process.exitCode = 1;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
