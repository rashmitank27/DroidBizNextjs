#!/usr/bin/env node

/**
 * Build Optimization Script for Excel-Based Tutorial System
 * This script optimizes the build process by pre-processing Excel data
 * and generating optimized static content.
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const DATA_DIR = path.join(process.cwd(), 'data', 'excel');
const OUTPUT_DIR = path.join(process.cwd(), '.next-cache');

class BuildOptimizer {
  constructor() {
    this.stats = {
      filesProcessed: 0,
      totalPages: 0,
      totalSize: 0,
      errors: 0
    };
  }

  /**
   * Main optimization process
   */
  async optimize() {
    console.log('🚀 Starting build optimization...\n');
    
    try {
      // Create output directory
      this.ensureOutputDir();
      
      // Process all Excel files
      await this.processExcelFiles();
      
      // Generate sitemap
      await this.generateSitemap();
      
      // Generate robots.txt
      await this.generateRobotsTxt();
      
      // Show statistics
      this.showStats();
      
      console.log('✅ Build optimization completed successfully!');
    } catch (error) {
      console.error('❌ Build optimization failed:', error);
      process.exit(1);
    }
  }

  /**
   * Ensure output directory exists
   */
  ensureOutputDir() {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
  }

  /**
   * Process all Excel files in the data directory
   */
  async processExcelFiles() {
    if (!fs.existsSync(DATA_DIR)) {
      throw new Error(`Data directory not found: ${DATA_DIR}`);
    }

    const files = fs.readdirSync(DATA_DIR)
      .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'))
      .sort();

    console.log(`📁 Found ${files.length} Excel files to process:\n`);

    for (const filename of files) {
      await this.processExcelFile(filename);
    }
  }

  /**
   * Process individual Excel file
   */
  async processExcelFile(filename) {
    const filePath = path.join(DATA_DIR, filename);
    const subjectName = path.basename(filename, '.xlsx').toLowerCase();
    
    console.log(`📊 Processing ${filename}...`);
    
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(fileBuffer, {
        cellStyles: true,
        cellFormulas: true,
        cellDates: true
      });

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        console.log(`⚠️  Warning: No data found in ${filename}`);
        return;
      }

      // Transform and validate data
      const transformedData = this.transformExcelData(jsonData, subjectName);
      
      // Save processed data
      const outputPath = path.join(OUTPUT_DIR, `${subjectName}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(transformedData, null, 2));

      // Update statistics
      this.stats.filesProcessed++;
      this.stats.totalPages += transformedData.content.length;
      this.stats.totalSize += Buffer.byteLength(JSON.stringify(transformedData));

      console.log(`   ✅ Processed ${transformedData.content.length} pages`);
      
    } catch (error) {
      console.log(`   ❌ Error processing ${filename}: ${error.message}`);
      this.stats.errors++;
    }
  }

  /**
   * Transform Excel data to optimized format
   */
  transformExcelData(excelData, subjectName) {
    const content = excelData.map((row, index) => {
      // Validate required fields
      if (!row.title || !row.url || !row.content) {
        console.log(`   ⚠️  Warning: Missing required fields in row ${index + 1}`);
      }

      return {
        id: row.id || index + 1,
        title: row.title || `Untitled ${index + 1}`,
        url: row.url || `page-${index + 1}`,
        type: row.type || 1,
        content: this.optimizeContent(row.content || ''),
        keywords: row.keywords || '',
        titleTag: row.titleTag || row.title || '',
        descriptionTag: row.descriptionTag || '',
        shortDesc: this.extractShortDesc(row.content || ''),
        // Add SEO optimizations
        wordCount: this.getWordCount(row.content || ''),
        readingTime: this.calculateReadingTime(row.content || ''),
        lastModified: new Date().toISOString()
      };
    });

    // Determine base URL
    const baseUrl = subjectName === 'blogs' ? '/blogs' : `/${subjectName}`;

    return {
      id: subjectName,
      name: this.capitalizeFirstLetter(subjectName),
      base_url: baseUrl,
      content: content,
      keywords: content.length > 0 ? content[0].keywords : '',
      titleTag: content.length > 0 ? content[0].titleTag : `${this.capitalizeFirstLetter(subjectName)} Tutorial`,
      descriptionTag: content.length > 0 ? content[0].descriptionTag : `Learn ${subjectName} programming with comprehensive tutorials.`,
      totalPages: content.length,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Optimize content by cleaning and formatting
   */
  optimizeContent(content) {
    if (!content) return '';
    
    return content
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .trim();
  }

  /**
   * Extract short description from content
   */
  extractShortDesc(content) {
    if (!content) return '';
    
    const cleanContent = content
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]*`/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    return cleanContent.length > 155 
      ? cleanContent.substring(0, 155) + '...'
      : cleanContent;
  }

  /**
   * Get word count of content
   */
  getWordCount(content) {
    if (!content) return 0;
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Calculate reading time (average 200 words per minute)
   */
  calculateReadingTime(content) {
    const wordCount = this.getWordCount(content);
    const readingTime = Math.ceil(wordCount / 200);
    return readingTime || 1;
  }

  /**
   * Capitalize first letter
   */
  capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Generate sitemap.xml
   */
  async generateSitemap() {
    console.log('\n🗺️  Generating sitemap...');
    
    const sitemapEntries = [];
    const baseUrl = 'https://www.droidbiz.in'; // Update with your domain
    
    // Add homepage
    sitemapEntries.push({
      url: baseUrl,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: '1.0'
    });

    // Read processed data and generate URLs
    const processedFiles = fs.readdirSync(OUTPUT_DIR)
      .filter(file => file.endsWith('.json'));

    for (const filename of processedFiles) {
      const filePath = path.join(OUTPUT_DIR, filename);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      for (const item of data.content) {
        const url = data.id === 'blogs' 
          ? `${baseUrl}/blogs/${item.url}`
          : `${baseUrl}/${data.id}/${item.url}`;
        
        sitemapEntries.push({
          url: url,
          lastmod: item.lastModified,
          changefreq: 'weekly',
          priority: '0.8'
        });
      }
    }

    // Generate XML
    const sitemap = this.generateSitemapXML(sitemapEntries);
    fs.writeFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), sitemap);
    
    console.log(`   ✅ Generated sitemap with ${sitemapEntries.length} URLs`);
  }

  /**
   * Generate sitemap XML content
   */
  generateSitemapXML(entries) {
    const urls = entries.map(entry => `
  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  }

  /**
   * Generate robots.txt
   */
  async generateRobotsTxt() {
    console.log('\n🤖 Generating robots.txt...');
    
    const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: https://www.droidbiz.in/sitemap.xml

# Crawl-delay
Crawl-delay: 1

# Disallow admin paths (if any)
Disallow: /admin/
Disallow: /api/
Disallow: /.next/
`;

    fs.writeFileSync(path.join(process.cwd(), 'public', 'robots.txt'), robotsTxt);
    console.log('   ✅ Generated robots.txt');
  }

  /**
   * Show optimization statistics
   */
  showStats() {
    const totalSizeMB = (this.stats.totalSize / 1024 / 1024).toFixed(2);
    
    console.log('\n📊 Build Optimization Statistics:');
    console.log(`   📁 Files processed: ${this.stats.filesProcessed}`);
    console.log(`   📄 Total pages: ${this.stats.totalPages}`);
    console.log(`   💾 Total size: ${totalSizeMB} MB`);
    console.log(`   ❌ Errors: ${this.stats.errors}`);
    console.log(`   ⚡ Average pages per file: ${Math.round(this.stats.totalPages / this.stats.filesProcessed)}`);
  }
}

// Run optimization if called directly
if (require.main === module) {
  const optimizer = new BuildOptimizer();
  optimizer.optimize();
}

module.exports = BuildOptimizer;