#!/usr/bin/env node

/**
 * Deployment Preparation Script
 * Prepares the project for Vercel deployment by ensuring all static files are ready
 */

const fs = require('fs');
const path = require('path');

class DeploymentPreparer {
  constructor() {
    this.cacheDir = path.join(process.cwd(), '.next-cache');
    this.publicDir = path.join(process.cwd(), 'public');
    this.apiDir = path.join(this.publicDir, 'api');
  }

  async prepare() {
    console.log('🚀 Preparing for Vercel deployment...\n');

    try {
      // 1. Verify cache exists
      await this.verifyCacheExists();
      
      // 2. Copy cache to public API routes
      await this.createPublicAPIRoutes();
      
      // 3. Generate deployment info
      await this.generateDeploymentInfo();
      
      // 4. Validate all required files
      await this.validateDeployment();
      
      console.log('✅ Deployment preparation completed successfully!');
      console.log('📦 Ready for Vercel deployment\n');
      
    } catch (error) {
      console.error('❌ Deployment preparation failed:', error.message);
      process.exit(1);
    }
  }

  async verifyCacheExists() {
    console.log('🔍 Verifying cache directory...');
    
    if (!fs.existsSync(this.cacheDir)) {
      throw new Error('.next-cache directory not found. Run "npm run optimize" first.');
    }

    const jsonFiles = fs.readdirSync(this.cacheDir)
      .filter(file => file.endsWith('.json') && file !== 'file-hashes.json');

    if (jsonFiles.length === 0) {
      throw new Error('No processed data found in cache. Run "npm run optimize" first.');
    }

    console.log(`   ✅ Found ${jsonFiles.length} processed data files`);
  }

  async createPublicAPIRoutes() {
    console.log('📁 Creating public API routes...');
    
    // Ensure API directories exist
    if (!fs.existsSync(this.apiDir)) {
      fs.mkdirSync(this.apiDir, { recursive: true });
    }

    const dataApiDir = path.join(this.apiDir, 'data');
    if (!fs.existsSync(dataApiDir)) {
      fs.mkdirSync(dataApiDir, { recursive: true });
    }

    // Copy manifest
    const manifestSrc = path.join(this.cacheDir, 'manifest.json');
    const manifestDest = path.join(this.apiDir, 'manifest.json');
    
    if (fs.existsSync(manifestSrc)) {
      fs.copyFileSync(manifestSrc, manifestDest);
      console.log('   ✅ Copied manifest.json to API route');
    }

    // Copy all data files
    const dataFiles = fs.readdirSync(this.cacheDir)
      .filter(file => file.endsWith('.json') && file !== 'file-hashes.json' && file !== 'manifest.json');

    let copiedCount = 0;
    for (const file of dataFiles) {
      const src = path.join(this.cacheDir, file);
      const dest = path.join(dataApiDir, file);
      fs.copyFileSync(src, dest);
      copiedCount++;
    }

    console.log(`   ✅ Copied ${copiedCount} data files to API routes`);
  }

  async generateDeploymentInfo() {
    console.log('📋 Generating deployment info...');
    
    const deploymentInfo = {
      buildTime: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      cacheFiles: fs.readdirSync(this.cacheDir).filter(f => f.endsWith('.json')).length,
      deploymentId: this.generateDeploymentId(),
      environment: 'production'
    };

    fs.writeFileSync(
      path.join(this.publicDir, 'deployment-info.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log('   ✅ Generated deployment-info.json');
  }

  async validateDeployment() {
    console.log('🔍 Validating deployment readiness...');
    
    const requiredFiles = [
      'public/sitemap.xml',
      'public/robots.txt',
      'public/api/manifest.json',
      'public/deployment-info.json'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }

    // Check if data API directory has files
    const dataApiDir = path.join(this.apiDir, 'data');
    const dataFiles = fs.existsSync(dataApiDir) ? fs.readdirSync(dataApiDir) : [];
    
    if (dataFiles.length === 0) {
      throw new Error('No data files found in public/api/data/');
    }

    console.log('   ✅ All required files present');
    console.log(`   ✅ ${dataFiles.length} data API routes ready`);
  }

  generateDeploymentId() {
    return 'deploy_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// Run if called directly
if (require.main === module) {
  const preparer = new DeploymentPreparer();
  preparer.prepare();
}

module.exports = DeploymentPreparer;