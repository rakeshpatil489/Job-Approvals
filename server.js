const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'text/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
};

const LIVE_RELOAD_SCRIPT = `
<script>
  const es = new EventSource('/livereload');
  es.onmessage = () => location.reload();
</script>`;

let sseClients = [];

// Watch all files in the project directory
fs.watch(__dirname, { recursive: true }, (event, filename) => {
  if (!filename || filename.startsWith('.')) return;
  console.log(`Changed: ${filename} — reloading...`);
  sseClients.forEach(res => res.write('data: reload\n\n'));
});

const server = http.createServer((req, res) => {
  // Live reload SSE endpoint
  if (req.url === '/livereload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write('\n');
    sseClients.push(res);
    req.on('close', () => {
      sseClients = sseClients.filter(c => c !== res);
    });
    return;
  }

  let filePath = req.url === '/' ? '/Approval-chains-prototype.html' : req.url;
  filePath = path.join(__dirname, filePath);

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    // Inject live reload script before </body> in HTML files
    if (ext === '.html') {
      data = Buffer.from(data.toString().replace('</body>', LIVE_RELOAD_SCRIPT + '</body>'));
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
