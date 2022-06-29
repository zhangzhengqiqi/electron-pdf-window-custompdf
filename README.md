# electron-pdf-window

view PDF files in electron browser windows. this module adds support for viewing
PDF files in electron [`BrowserWindow`s](http://electron.atom.io/docs/api/browser-window/).
it works even if you navigate to a PDF file from a site, or opening a PDF file in
a new window. a `PDFWindow` instance is just a subclass of `BrowserWindow` so it
can be used just like it.

<p align="center">
  <img align="center" src="./screenshot.png" height=400 />
</p>


``` javascript
const { app } = require('electron')
const PDFWindow = require('electron-pdf-window')

app.on('ready', () => {
  const win = new PDFWindow({
    width: 800,
    height: 600
  })

  win.loadURL('http://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf')
})
```

## install

```
$ npm i electron-pdf-window
```

## usage

#### `win = new PDFWindow([opts])`
`win` is an electron [`BrowserWindow`](http://electron.atom.io/docs/api/browser-window/)
that has support for viewing PDF files.

#### `PDFWindow.addSupport(win)`
adds PDF viewing support for `win`, which is a `BrowserWindow` instance.

## using from the renderer process

Using the `PDFWindow` class directly from the renderer process is not
recommended, because electron doesn't support proper extending of their built-in
classes. In order to add PDF support from the renderer, use the `addSupport`
method.

``` js
const { BrowserWindow } = require('electron').remote
const PDFWindow = require('electron-pdf-window')

const win = new BrowserWindow({ width: 800, height: 600 })

PDFWindow.addSupport(win)

win.loadURL('file:///a/b/c.pdf')
```

## test

```
$ npm test
```

### 项目定制处理
库内PDF_JS_PATH默认为_dirname 在本项目中 _dirname的地址并不全 因此会导致资源无法正常预览
因此修改了本地electron-pdf-window库内的地址加载方式
1.进入electron-pdf-window的index.js
将 const PDF_JS_PATH = path.join(__dirname, 'pdfjs', 'web', 'viewer.html') 更改为
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

2.为了提高加载速度
①index.js内 loadURL()方法 改为loadURL(url, options) {
    super.loadURL(`file://${path.join(__dirname, 'pdfjs', 'web', 'viewer.html')}?file=${decodeURIComponent(url)}`, options)
}
②index.js内 第113行 改为 browserWindow.loadURL = function (url, options) {
    load.call(browserWindow, `file://${PDF_JS_PATH}?file=${decodeURIComponent(url)}`, options)
  }