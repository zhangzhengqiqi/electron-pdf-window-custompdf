const isRenderer = require('is-electron-renderer')
const electron = require('electron')
const path = require('path')
const readChunk = require('read-chunk')
const fileType = require('file-type')
const extend = require('deep-extend')
const got = require('got')

const BrowserWindow = isRenderer
  ? electron.remote.BrowserWindow : electron.BrowserWindow

const URL = require('url');
const isDev = require('electron-is-dev')

const app = isRenderer
  ? electron.remote.app : electron.app
let PDF_JS_PATH = ''

if (isDev) {
  PDF_JS_PATH = URL.format({ pathname: path.resolve(path.resolve(__dirname), 'pdfjs', 'web', 'viewer.html') })
} else if (process.platform === 'darwin') {
  PDF_JS_PATH = path.join(app.getAppPath() + '/' + __dirname, 'pdfjs', 'web', 'viewer.html') //mac
} else {
  PDF_JS_PATH = path.join(`${app.getAppPath()}\\${__dirname}`, 'pdfjs', 'web', 'viewer.html') //windows
}

function isAlreadyLoadedWithPdfJs (url) {
  return url.startsWith(`file://${PDF_JS_PATH}?file=`)
}

function isFile (url) {
  return url.match(/^file:\/\//i)
}

function getMimeOfFile (url) {
  const fileUrl = url.replace(/^file:\/\//i, '')
  const buffer = readChunk.sync(fileUrl, 0, 262)
  const ft = fileType(buffer)

  return ft ? ft.mime : null
}

function hasPdfExtension (url) {
  return url.match(/\.pdf$/i)
}

function hasBlobData(url){
  return url.match(/^blob:/i);
}

function isPDF (url) {
  return new Promise((resolve, reject) => {
    if (isAlreadyLoadedWithPdfJs(url)) {
      resolve(false)
    } else if (isFile(url)) {
      resolve(getMimeOfFile(url) === 'application/pdf')
    } else if (hasPdfExtension(url)) {
      resolve(true)
    } else if(hasBlobData(url)) {
      resolve(true);
    } else {
      got.head(url).then(res => {
        if (res.headers.location) {
          isPDF(res.headers.location).then(isit => resolve(isit))
          .catch(err => reject(err))
        } else {
          resolve(res.headers['content-type'].indexOf('application/pdf') !== -1)
        }
      }).catch(err => reject(err))
    }
  })
}

class PDFWindow extends BrowserWindow {
  constructor (opts) {
    super(extend({}, opts, {
      webPreferences: { nodeIntegration: false }
    }))

    this.webContents.on('will-navigate', (event, url) => {
      event.preventDefault()
      this.loadURL(url)
    })

    this.webContents.on('new-window', (event, url) => {
      event.preventDefault()

      event.newGuest = new PDFWindow();
      event.newGuest.loadURL(url);
      event.newGuest.setMenu(null);
    })
  }

  loadURL (url, options) {
    super.loadURL(`file://${path.join(__dirname, 'pdfjs', 'web', 'viewer.html')}?file=${decodeURIComponent(url)}`, options)
  }
}

PDFWindow.addSupport = function (browserWindow) {
  browserWindow.webContents.on('will-navigate', (event, url) => {
    event.preventDefault();
    browserWindow.loadURL(url);
    event.newGuest.setMenu(null);
  })

  browserWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault()

    event.newGuest = new PDFWindow();
    event.newGuest.loadURL(url);
    event.newGuest.setMenu(null);
  })

  const load = browserWindow.loadURL
  browserWindow.loadURL = function (url, options) {
    load.call(browserWindow, `file://${PDF_JS_PATH}?file=${decodeURIComponent(url)}`, options)
  }
}

module.exports = PDFWindow
