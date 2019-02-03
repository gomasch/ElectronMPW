// Copyright 2019 Martin Schmidt mail@gomasch.de
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

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

module.exports.StandardMenu = StandardMenu;