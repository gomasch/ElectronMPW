const electron = require('electron')
// Module to control application life.
const app = electron.app
const Menu = electron.Menu


// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

/**
 * Create the standard menu
 * @param {BrowserWindow} mainWindow 
 */
function StandardMenu(mainWindow) {
  return [
  {
    label: '&File',
    submenu: [
      {
          label: '&New',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send("new-file")
      },
      {
          label: 'Import',
          click: (e) => mainWindow.webContents.send("import")
      },
      {type: 'separator'},
      {
          label: '&Open…',
          accelerator: 'CmdOrCtrl+O',
          click: (e) => mainWindow.webContents.send("open")
      },
      {
          label: '&Save',
          accelerator: 'CmdOrCtrl+S',
          click: (e) => mainWindow.webContents.send("save")
      },
      {
          label: 'Sa&ve As…',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: (e) => mainWindow.webContents.send("saveAs")
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'delete' },
      { role: 'selectall' }
    ]
  }
];
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 800, height: 600 })

  // where to store settings? be independent of productName in package.json
  app.setPath('userData', path.join(app.getPath('appData'), "electron-mpw"));

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  // Check if we are on a MAC
  if (process.platform === 'darwin') {
    // Create our menu entries so that we can use MAC shortcuts
    if (Menu) {
      Menu.setApplicationMenu(Menu.buildFromTemplate(StandardMenu(mainWindow).unshift( 
        [{
          label: "MPW",
          submenu: [
            {role: 'about'},
            {type: 'separator'},
            {role: 'services', submenu: []},
            {type: 'separator'},
            {role: 'hide'},
            {role: 'hideothers'},
            {role: 'unhide'},
            {type: 'separator'},
            {role: 'quit'}
          ]
        }]))); // use standard menu and add an App menu at the beginning
    }
  }
  else {
    // windows
    if (Menu) {      
      mainWindow.setAutoHideMenuBar(true);
      Menu.setApplicationMenu(Menu.buildFromTemplate(StandardMenu(mainWindow)));
    }
  }
  
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  //if (process.platform !== 'darwin') {
  app.quit()
  //}
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
