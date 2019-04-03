// Copyright 2017-2019 Martin Schmidt mail@gomasch.de
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// @ts-check
const electron = require('electron');
const path = require('path');
const fs = require('fs');

// https://github.com/ccnokes/electron-tutorials/tree/master/storing-data
class Settings {
  constructor(opts) {
    // renderer has to get `app` module via remote, main gets it directly
    this.folder = (electron.app || electron.remote.app).getPath('userData');
    this.path = path.join(this.folder, opts.configName + '.json');
    this.data = parseDataFile(this.path, opts.defaults);
    this.performSave = () => { fs.writeFileSync(this.path, JSON.stringify(this.data)); };
  }

  get(key) {
    return this.data[key];
  }

  set(key, val) {
    try {
      this.data[key] = val;
      fs.exists(this.folder,
        exists => {
          if (!exists) {
            fs.mkdir(this.folder,
              err => {
                if (err) {
                  console.log(err);
                } else {
                  this.performSave();
                }
              });
          } else {
            this.performSave();
          }
        });
    } catch (error) {
      console.log("failed to save settings " + error)
    }
  }
}

function parseDataFile(filePath, defaults) {
  try {
    return JSON.parse(fs.readFileSync(filePath).toString());
  } catch (error) {
    return defaults;
  }
}

module.exports = Settings;