const fs = require('fs');
const path = require('path');

// Helper function to recursively copy directories
function copyRecursive(src, dest) {
  const items = fs.readdirSync(src);
  items.forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyRecursive(srcPath, destPath);
    } else if (stat.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Helper function to recursively delete directories
function deleteRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(file => {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        deleteRecursive(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

console.log('🏗️  Starting build...\n');

// Read site slug for analytics segmentation
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const siteSlug = pkg.siteSlug || 'unknown';
console.log(`📊 Site slug: ${siteSlug}\n`);

// Clear dist directory
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  console.log('🧹 Cleaning dist directory...');
  deleteRecursive(distDir);
}

// Create fresh dist directory
fs.mkdirSync(distDir, { recursive: true });
console.log('✓ Created dist directory\n');

// Load analytics snippet for head injection
const analyticsPath = path.join(__dirname, 'vendor', 'integralthemes', 'components', 'analytics.html');
let analyticsHtml = '';
if (fs.existsSync(analyticsPath)) {
  analyticsHtml = fs.readFileSync(analyticsPath, 'utf8');
  console.log('✓ Loaded analytics snippet for injection\n');
} else {
  console.log('⚠ Analytics snippet not found, pages will be built without it\n');
}

// Load chat widget for injection
const widgetPath = path.join(__dirname, 'vendor', 'integralthemes', 'components', 'widgets.html');
let widgetHtml = '';
if (fs.existsSync(widgetPath)) {
  widgetHtml = fs.readFileSync(widgetPath, 'utf8');
  console.log('✓ Loaded chat widget for injection\n');
} else {
  console.log('⚠ Chat widget not found, pages will be built without it\n');
}

// Copy HTML files and inject widget
console.log('📄 Copying HTML files...');
const htmlFiles = ['index.html'];
htmlFiles.forEach(file => {
  const srcPath = path.join(__dirname, 'src', file);
  const destPath = path.join(distDir, file);
  if (fs.existsSync(srcPath)) {
    let htmlContent = fs.readFileSync(srcPath, 'utf8');

    // Inject analytics + site_name before </head>
    if (analyticsHtml) {
      const siteNameScript = `<script>window.IE_SITE_NAME = '${siteSlug}';</script>`;
      htmlContent = htmlContent.replace('</head>', `${siteNameScript}\n${analyticsHtml}\n</head>`);
    }

    // Inject widget before </body> tag if widget exists
    if (widgetHtml) {
      htmlContent = htmlContent.replace('</body>', `${widgetHtml}\n</body>`);
    }

    const tags = [analyticsHtml ? 'analytics' : '', widgetHtml ? 'widget' : ''].filter(Boolean);
    fs.writeFileSync(destPath, htmlContent, 'utf8');
    console.log(`  ✓ ${file}${tags.length ? ` (${tags.join(', ')})` : ''}`);
  } else {
    console.log(`  ⚠ ${file} (not found)`);
  }
});

// Copy CSS files
console.log('\n🎨 Copying CSS files...');
const cssDir = path.join(distDir, 'css');
if (!fs.existsSync(cssDir)) {
  fs.mkdirSync(cssDir, { recursive: true });
}
const srcCssDir = path.join(__dirname, 'src', 'css');
if (fs.existsSync(srcCssDir)) {
  const cssFiles = fs.readdirSync(srcCssDir);
  cssFiles.forEach(file => {
    // Skip backup files
    if (file.endsWith('.backup')) {
      return;
    }
    const srcPath = path.join(srcCssDir, file);
    const destPath = path.join(cssDir, file);
    fs.copyFileSync(srcPath, destPath);
    console.log(`  ✓ css/${file}`);
  });
}

// Copy JS files
console.log('\n📜 Copying JS files...');
const jsDir = path.join(distDir, 'js');
if (!fs.existsSync(jsDir)) {
  fs.mkdirSync(jsDir, { recursive: true });
}
const srcJsDir = path.join(__dirname, 'src', 'js');
if (fs.existsSync(srcJsDir)) {
  const jsFiles = fs.readdirSync(srcJsDir);
  jsFiles.forEach(file => {
    const srcPath = path.join(srcJsDir, file);
    const destPath = path.join(jsDir, file);
    fs.copyFileSync(srcPath, destPath);
    console.log(`  ✓ js/${file}`);
  });
}

// Copy assets (icons, etc.)
console.log('\n📁 Copying assets...');
const assetsDir = path.join(__dirname, 'src', 'assets');
if (fs.existsSync(assetsDir)) {
  const destAssetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(destAssetsDir)) {
    fs.mkdirSync(destAssetsDir, { recursive: true });
  }
  copyRecursive(assetsDir, destAssetsDir);
  console.log('  ✓ Copied assets directory');
} else {
  console.log('  ℹ No assets directory found');
}

// Copy images
console.log('\n🖼️  Copying images...');
const imagesDir = path.join(__dirname, 'src', 'images');
if (fs.existsSync(imagesDir)) {
  const destImagesDir = path.join(distDir, 'images');
  if (!fs.existsSync(destImagesDir)) {
    fs.mkdirSync(destImagesDir, { recursive: true });
  }
  copyRecursive(imagesDir, destImagesDir);

  // Count files
  let fileCount = 0;
  function countFiles(dir) {
    fs.readdirSync(dir).forEach(item => {
      const itemPath = path.join(dir, item);
      if (fs.statSync(itemPath).isDirectory()) {
        countFiles(itemPath);
      } else {
        fileCount++;
      }
    });
  }
  countFiles(destImagesDir);
  console.log(`  ✓ Copied ${fileCount} image files`);
} else {
  console.log('  ℹ No images directory found');
}

// Copy vendored integralthemes
console.log('\n🎨 Copying vendored theme...');
const vendorSrcDir = path.join(__dirname, 'vendor', 'integralthemes');
if (fs.existsSync(vendorSrcDir)) {
  const vendorDestDir = path.join(distDir, 'vendor', 'integralthemes');
  if (!fs.existsSync(path.join(distDir, 'vendor'))) {
    fs.mkdirSync(path.join(distDir, 'vendor'), { recursive: true });
  }
  fs.mkdirSync(vendorDestDir, { recursive: true });

  copyRecursive(vendorSrcDir, vendorDestDir);

  // Verify critical theme files
  const themeFile = path.join(vendorDestDir, 'theme', 'theme.css');
  if (fs.existsSync(themeFile)) {
    console.log('  ✓ vendor/integralthemes/theme/theme.css');
    console.log('  ✓ vendor/integralthemes/theme/tokens.css');
    console.log('  ✓ vendor/integralthemes/theme/base.css');
    console.log('  ✓ vendor/integralthemes/theme/layout.css');
    console.log('  ✓ vendor/integralthemes/theme/components.css');

    // Count asset files
    const brandDir = path.join(vendorDestDir, 'assets', 'brand');
    const iconsDir = path.join(vendorDestDir, 'assets', 'icons');
    let brandCount = 0;
    let iconsCount = 0;

    if (fs.existsSync(brandDir)) {
      brandCount = fs.readdirSync(brandDir).length;
    }
    if (fs.existsSync(iconsDir)) {
      iconsCount = fs.readdirSync(iconsDir).length;
    }

    console.log(`  ✓ ${brandCount} brand assets`);
    console.log(`  ✓ ${iconsCount} icon assets`);
  } else {
    console.log('  ⚠ Theme files may be incomplete');
  }
} else {
  console.error('  ❌ ERROR: vendor/integralthemes not found!');
  console.error('     The shared theme must be vendored before building.');
  process.exit(1);
}

// Copy favicon if it exists
console.log('\n🎨 Copying favicon...');
const faviconSrc = path.join(__dirname, 'src', 'favicon.ico');
const faviconDest = path.join(distDir, 'favicon.ico');
if (fs.existsSync(faviconSrc)) {
  fs.copyFileSync(faviconSrc, faviconDest);
  console.log('  ✓ favicon.ico');
} else {
  console.log('  ℹ No favicon.ico found in src/');
}

console.log('\n✅ Build completed successfully!');
console.log(`📦 Output directory: ${distDir}`);
console.log('\n🔗 Critical files:');
console.log(`   - dist/vendor/integralthemes/theme/theme.css`);
console.log(`   - dist/css/site.css`);
console.log(`   - dist/index.html`);
if (analyticsHtml) {
  console.log(`   - Analytics injected (site_name: ${siteSlug}) ✓`);
}
if (widgetHtml) {
  console.log(`   - Chat widget injected ✓`);
}
console.log('');
