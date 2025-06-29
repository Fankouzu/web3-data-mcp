#!/usr/bin/env node

/**
 * Verify all npm commands mentioned in README files
 */

const fs = require('fs');
const path = require('path');

console.error('🔍 Verifying npm commands in README files...\n');

// Read package.json to get available scripts
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const availableScripts = Object.keys(packageJson.scripts);

// Read README files
const readmeFiles = ['README.md', 'README.zh-CN.md'];
const allCommands = new Set();
const commandsInFiles = {};

readmeFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(/npm run [a-z:-]+/g) || [];
    
    commandsInFiles[file] = [];
    matches.forEach(match => {
      const command = match.replace('npm run ', '');
      allCommands.add(command);
      commandsInFiles[file].push({ command, match });
    });
  }
});

// Check which commands are missing or incorrect
const missingCommands = [];
const validCommands = [];

allCommands.forEach(command => {
  if (availableScripts.includes(command)) {
    validCommands.push(command);
  } else {
    missingCommands.push(command);
  }
});

// Report results
console.error('📊 Summary:');
console.error(`✅ Valid commands: ${validCommands.length}`);
console.error(`❌ Missing/incorrect commands: ${missingCommands.length}\n`);

if (missingCommands.length > 0) {
  console.error('❌ Missing or incorrect commands:');
  missingCommands.forEach(cmd => {
    console.error(`   - npm run ${cmd}`);
    
    // Suggest corrections
    const suggestions = availableScripts.filter(script => 
      script.includes(cmd.replace(/[-:]/g, '')) || 
      cmd.includes(script.replace(/[-:]/g, ''))
    );
    
    if (suggestions.length > 0) {
      console.error(`     💡 Did you mean: ${suggestions.map(s => `npm run ${s}`).join(' or ')}`);
    }
  });
  console.error('');
}

// Show all available scripts for reference
console.error('📚 Available npm scripts:');
availableScripts.sort().forEach(script => {
  console.error(`   - npm run ${script}`);
});

console.error('\n✨ Verification complete!');

// Exit with error if there are missing commands
if (missingCommands.length > 0) {
  process.exit(1);
} 