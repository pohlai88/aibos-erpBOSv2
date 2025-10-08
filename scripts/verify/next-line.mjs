#!/usr/bin/env node

import { createRequire } from 'node:module';
const req = createRequire(process.cwd() + '/');

console.log('🔍 Verifying Next.js runtime version...');

try {
  const nextPkg = req('next/package.json');
  
  if (!/^14\.2\./.test(nextPkg.version)) {
    console.error(`❌ next runtime is ${nextPkg.version}, expected 14.2.x`);
    process.exit(1);
  }
  
  console.log(`✅ next runtime ${nextPkg.version} OK`);
  
  // Also check React versions
  const reactPkg = req('react/package.json');
  const reactDomPkg = req('react-dom/package.json');
  
  if (!/^18\./.test(reactPkg.version)) {
    console.error(`❌ react runtime is ${reactPkg.version}, expected 18.x`);
    process.exit(1);
  }
  
  if (!/^18\./.test(reactDomPkg.version)) {
    console.error(`❌ react-dom runtime is ${reactDomPkg.version}, expected 18.x`);
    process.exit(1);
  }
  
  console.log(`✅ react runtime ${reactPkg.version} OK`);
  console.log(`✅ react-dom runtime ${reactDomPkg.version} OK`);
  
} catch (error) {
  console.error('❌ Failed to verify runtime versions:', error.message);
  process.exit(1);
}
