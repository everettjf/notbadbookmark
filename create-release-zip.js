#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;
const zipName = `NotBadBookmark-v${version}.zip`;
const releaseDir = 'release';

// Files/dirs that make up the shipped extension (canonical sources).
const staticAssets = ['manifest.json', 'bookmarks.html', 'icons'];

if (fs.existsSync(zipName)) {
  fs.unlinkSync(zipName);
  console.log(`Removed existing ${zipName}`);
}

try {
  // Always rebuild the release directory from scratch so stale files never leak in.
  fs.rmSync(releaseDir, { recursive: true, force: true });
  fs.mkdirSync(`${releaseDir}/dist`, { recursive: true });

  console.log('Copying build output and static assets into release/...');
  execSync(`cp -r dist/* ${releaseDir}/dist/`, { stdio: 'inherit' });
  for (const asset of staticAssets) {
    execSync(`cp -r ${asset} ${releaseDir}/`, { stdio: 'inherit' });
  }

  console.log('Creating release zip...');
  execSync(`cd ${releaseDir} && zip -r ../${zipName} .`, { stdio: 'inherit' });
  console.log(`✅ Successfully created ${zipName}`);

  console.log('\n📦 Zip contents:');
  execSync(`unzip -l ${zipName}`, { stdio: 'inherit' });

  console.log(`\n🚀 Ready for Chrome Web Store upload: ${zipName}`);
} catch (error) {
  console.error('❌ Error creating zip:', error.message);
  process.exit(1);
}
