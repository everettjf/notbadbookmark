#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get version from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

// Create zip filename
const zipName = `NotBadBookmark-v${version}.zip`;

// Remove existing zip if it exists
if (fs.existsSync(zipName)) {
  fs.unlinkSync(zipName);
  console.log(`Removed existing ${zipName}`);
}

// Create zip from release directory
try {
  console.log('Creating release zip...');
  execSync(`cd release && zip -r ../${zipName} .`, { stdio: 'inherit' });
  console.log(`✅ Successfully created ${zipName}`);
  
  // Show zip contents
  console.log('\n📦 Zip contents:');
  execSync(`unzip -l ${zipName}`, { stdio: 'inherit' });
  
  console.log(`\n🚀 Ready for Chrome Web Store upload: ${zipName}`);
} catch (error) {
  console.error('❌ Error creating zip:', error.message);
  process.exit(1);
}
