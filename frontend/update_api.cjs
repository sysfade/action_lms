const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'src', 'api');
const files = fs.readdirSync(apiDir).filter(f => f.endsWith('.js') && f !== 'config.js');

files.forEach(file => {
  const filePath = path.join(apiDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let changed = false;

  // Add import if not present
  if (!content.includes("import { API_URL }")) {
    content = `import { API_URL } from './config';\n` + content;
    changed = true;
  }

  // Replace const BASE = '/api/...
  if (content.match(/const BASE = '\/api\//)) {
    content = content.replace(/const BASE = '\/api\/(.*?)';/g, 'const BASE = `${API_URL}/api/$1`;');
    changed = true;
  }

  // Replace fetch('/api/...
  if (content.match(/fetch\('\/api\//)) {
    content = content.replace(/fetch\('\/api\/(.*?)'/g, 'fetch(`${API_URL}/api/$1`');
    changed = true;
  }

  // Replace fetch(`/api/...
  if (content.match(/fetch\(`\/api\//)) {
    content = content.replace(/fetch\(`\/api\/(.*?)`/g, 'fetch(`${API_URL}/api/$1`');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
