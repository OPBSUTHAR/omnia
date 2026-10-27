/**
 * Points the generated Android release build at the OrbisNova keystore.
 *
 * Run this after `expo prebuild` and before `./gradlew assembleRelease`.
 * The keystore itself is never committed; CI restores it from secrets and
 * exposes it through the OMNIA_KEYSTORE_PATH environment variable.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const gradlePath = path.join(process.cwd(), 'android', 'app', 'build.gradle');

const requiredEnv = ['OMNIA_KEYSTORE_PATH', 'OMNIA_KEYSTORE_PASSWORD', 'OMNIA_KEY_ALIAS'];
const missing = requiredEnv.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

let source;
try {
  source = await readFile(gradlePath, 'utf8');
} catch {
  console.error('android/app/build.gradle not found. Run "npx expo prebuild --platform android" first.');
  process.exit(1);
}

if (source.includes('omniaRelease')) {
  console.log('Release signing already configured.');
  process.exit(0);
}

const keyPasswordEnv =
  "System.getenv('OMNIA_KEY_PASSWORD') ?: System.getenv('OMNIA_KEYSTORE_PASSWORD')";

const signingBlock = [
  'signingConfigs {',
  '        omniaRelease {',
  "            storeFile file(System.getenv('OMNIA_KEYSTORE_PATH'))",
  "            storePassword System.getenv('OMNIA_KEYSTORE_PASSWORD')",
  "            keyAlias System.getenv('OMNIA_KEY_ALIAS')",
  `            keyPassword ${keyPasswordEnv}`,
  '        }',
].join('\n');

if (!source.includes('signingConfigs {')) {
  console.error('Could not find the signingConfigs block in android/app/build.gradle.');
  process.exit(1);
}

let patched = source.replace('signingConfigs {', signingBlock);

const buildTypesIndex = patched.indexOf('buildTypes {');
if (buildTypesIndex === -1) {
  console.error('Could not find the buildTypes block in android/app/build.gradle.');
  process.exit(1);
}

const releaseIndex = patched.indexOf('release {', buildTypesIndex);
if (releaseIndex === -1) {
  console.error('Could not find the release build type in android/app/build.gradle.');
  process.exit(1);
}

const beforeRelease = patched.slice(0, releaseIndex);
const afterRelease = patched.slice(releaseIndex);

if (!afterRelease.includes('signingConfig signingConfigs.debug')) {
  console.error('Release build type does not use the expected debug signing config.');
  process.exit(1);
}

patched =
  beforeRelease + afterRelease.replace('signingConfig signingConfigs.debug', 'signingConfig signingConfigs.omniaRelease');

await writeFile(gradlePath, patched);
console.log('Configured android/app/build.gradle to sign release builds with the OrbisNova keystore.');
