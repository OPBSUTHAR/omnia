const { app, BrowserWindow, Menu, shell } = require('electron');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const APP_ROOT = path.join(__dirname, 'app');
const ICON = path.join(__dirname, 'build', 'icon.png');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function safeTarget(urlPath) {
  let pathname;
  try {
    pathname = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    pathname = '/';
  }
  const relative = pathname.replace(/^\/+/, '');
  let target = path.resolve(APP_ROOT, relative);
  if (target !== APP_ROOT && !target.startsWith(APP_ROOT + path.sep)) {
    return { file: null, status: 403 };
  }
  try {
    if (fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
  } catch {
    // Fall through to the .html probe below.
  }
  if (!fs.existsSync(target)) {
    const html = `${target}.html`;
    if (fs.existsSync(html)) target = html;
  }
  if (!fs.existsSync(target)) {
    return { file: path.join(APP_ROOT, '404.html'), status: 404 };
  }
  return { file: target, status: 200 };
}

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      const { file, status } = safeTarget(request.url || '/');
      if (!file || !fs.existsSync(file)) {
        response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Omnia could not load its interface.');
        return;
      }
      const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
      response.writeHead(status, {
        'Content-Type': type,
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      });
      fs.createReadStream(file)
        .on('error', () => response.end())
        .pipe(response);
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function openExternal(url) {
  if (/^https?:/i.test(url)) {
    void shell.openExternal(url);
  }
}

async function createWindow() {
  const server = await startServer();
  const { port } = server.address();
  const window = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 900,
    minHeight: 620,
    show: false,
    backgroundColor: '#08080C',
    title: 'Omnia',
    icon: fs.existsSync(ICON) ? ICON : undefined,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });

  window.once('ready-to-show', () => window.show());
  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://127.0.0.1:${port}`)) {
      event.preventDefault();
      openExternal(url);
    }
  });
  window.on('closed', () => server.close());
  await window.loadURL(`http://127.0.0.1:${port}/`);
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.setName('Omnia');
  app.setAppUserModelId('com.opbsuthar.omnia');
  app.on('second-instance', () => {
    const [window] = BrowserWindow.getAllWindows();
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
  });
  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    await createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) void createWindow();
    });
  });
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
