// Copyright 2017 Martin Schmidt mail@gomasch.de
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// @ts-check

// dialog access
const app = require('electron').remote;
const dialog = app.dialog;

// react
const React = require('react');
const ReactDOM = require('react-dom');

// logic
const Model = require('./model.js');
const MpwAlgorithm = require('./algorithm.js');

// user settings
const Settings = require('./settings.js');
const userSettings = new Settings({
    configName: 'user-preferences',
    defaults: {
        lastFileName: null
    }
});

// helper functions
function isString(val) {
    return typeof val === 'string';
};

// views
const { EditField, SearchSites, Sites, MergePreview } = require('./views.js');

/**
 * return copy of array of objects and remove this named property from them
 * @param {Object[]} array array of objects
 * @param {string} propertyName 
 */
function immutableRemovePropertyFromArray(array, propertyName) {
    return array.map((item, i) => {
        if (item.hasOwnProperty(propertyName)) {
            // clear it
            var newItem = { ...item };
            delete newItem[propertyName];
            return newItem;
        } else {
            return item;
        };
    });
}

class App extends React.Component {
    constructor() {
        super();
        this.state = this.getDefaultState();

        // These bindings are necessary to make `this` work in the callbacks
        this.getDefaultState = this.getDefaultState.bind(this);

        this.userChanged = this.userChanged.bind(this);
        this.masterpassChanged = this.masterpassChanged.bind(this);
        this.clearCalculatedPWs = this.clearCalculatedPWs.bind(this);

        this.filterTextChanged = this.filterTextChanged.bind(this);
        this.sitePropertyChanged = this.sitePropertyChanged.bind(this);

        this.clearFilter = this.clearFilter.bind(this);
        this.editSite = this.editSite.bind(this);
        this.stopEditSite = this.stopEditSite.bind(this);

        this.addSite = this.addSite.bind(this);
        this.removeSite = this.removeSite.bind(this);

        this.calcPW = this.calcPW.bind(this);

        this.canDiscardChanges = this.canDiscardChanges.bind(this);
        this.newFile = this.newFile.bind(this);
        this.openFile = this.openFile.bind(this);
        this.readFile = this.readFile.bind(this);

        this.saveAsFile = this.saveAsFile.bind(this);
        this.saveFile = this.saveFile.bind(this);
        this.performSave = this.performSave.bind(this);

        this.importFile = this.importFile.bind(this);
        this.importCancel = this.importCancel.bind(this);
        this.importApplyFromAdded = this.importApplyFromAdded.bind(this);
        this.importApplyFromNewer = this.importApplyFromNewer.bind(this);    
        this.importApplyFromConflicts = this.importApplyFromConflicts.bind(this);                        
    }

    // helper
    getDefaultState() {
        return {
            // configuration
            user: "John Doe",
            sites: [
                {
                    site: "ribeyesteaks.com", counter: 1, type: "LongPassword", login: "john@doe.org" //, optional: calculatedPW
                },
                { site: "amazon.com", counter: 2, type: "MaximumSecurityPassword", login: "jdoe@gorgelmail.com" },
            ],
            // ui
            masterpass: "",
            editSiteIndex: null,
            filterText: "",
            hasCalculatedPW: false, // cache if we had any
            // file
            validFileName: null,
            unsavedChanges: false,
            importFromSites: null  // MergedSites for merge preview
        };
    }

    // Life Cycle
    componentDidMount() {
        var path = userSettings.get('lastFileName');
        if (path) {
            this.readFile(path);
        }
    }
    componentDidUpdate(prevProps, prevState) {
        var fileName = this.state.validFileName;
        if (userSettings.get('lastFileName') != fileName) {
            // changed -> save
            userSettings.set('lastFileName', fileName);
        }
    }

    // Callbacks

    // Change Events
    userChanged(event) {
        this.setState({ user: event.target.value, unsavedChanges: true });
        this.clearCalculatedPWs();
    }

    masterpassChanged(event) {
        this.setState({ masterpass: event.target.value });
        this.clearCalculatedPWs();
    }

    // helper function
    clearCalculatedPWs() {
        if (this.state.hasCalculatedPW) {
            // clear old calculated pw necessary
            this.setState((prevstate, props) => {
                return ({
                    sites: immutableRemovePropertyFromArray(prevstate.sites, 'calculatedPW'),
                    hasCalculatedPW: false
                });
            });
        }
    }

    filterTextChanged(event) {
        this.setState({ filterText: event.target.value });
    }

    sitePropertyChanged(event) {
        const index = Number(event.target.id); // index to be an integer
        const propertyName = event.target.name;
        const propertyValue = event.target.value;

        this.setState((prevstate, props) => {
            const newSites = prevstate.sites.map((site, i) => {
                if (i === index) {
                    // apply update
                    var newSite = { ...site };
                    newSite[propertyName] = propertyValue;
                    if (propertyName != 'login') {
                        // remove calculated pw
                        delete newSite.calculatedPW;
                    }
                    return newSite;
                } else {
                    return site;
                };
            });
            return ({ sites: newSites, unsavedChanges: true });
        });
    }

    // Actions
    clearFilter(event) {
        event.preventDefault(); // prevent rerender
        this.setState({ filterText: "" });
    }

    editSite(event) {
        event.preventDefault(); // prevent rerender        
        const index = Number(event.target.value);

        if (index === this.state.editSiteIndex) {
            // same - unselect
            this.setState({ editSiteIndex: null });
        }
        else {
            this.setState({ editSiteIndex: index });
        }
    }

    stopEditSite(event) {
        event.preventDefault(); // prevent rerender
        this.setState({ editSiteIndex: null });
    }

    // entries
    addSite(event) {
        event.preventDefault();
        var newSites = this.state.sites.slice();
        newSites.push(new Model.Site("site.com"));
        this.setState({ sites: newSites, editSiteIndex: newSites.length - 1, unsavedChanges: true });
    }

    removeSite(event) {
        event.preventDefault(); // prevent rerender        
        const index = Number(event.target.value);
        const site = this.state.sites[index];

        const clickedIndex = dialog.showMessageBox(
            {
                message: "Do you want to remove entry for '" + site.site + "?",
                buttons: ["OK", "Cancel"], cancelId: 1
            });
        if (0 === clickedIndex) {
            // remove
            var newSites = this.state.sites.slice(); // copy
            newSites.splice(index, 1);
            this.setState({ sites: newSites, editSiteIndex: null, unsavedChanges: true })
        }
    }

    // pw management

    calcPW(event) {
        event.preventDefault();

        const index = Number(event.target.value);
        const site = { ...this.state.sites[index] };
        var self = this;

        // this calculation is surprisingly fast, the emscripten magic from js-scrypt is great
        MpwAlgorithm.AllSteps(self.state.user, self.state.masterpass, site.site, site.counter, site.type, function (err, sitePassword) {
            if (err) {
                alert(err);
            } else {
                // set it for that site
                self.setState((prevstate, props) => {
                    const newSites = prevstate.sites.map((site, i) => {
                        if (i === index) {
                            // apply update
                            var newSite = { ...site };
                            newSite.calculatedPW = sitePassword;
                            return newSite;
                        } else {
                            return site;
                        };
                    });
                    return ({ sites: newSites, hasCalculatedPW: true });
                });
            }
        });
    }

    // file operations

    /**
     * @param caption which action is asking this
     * @returns bool false if there are changes and the user does not want to throw them away
     */
    canDiscardChanges(caption) {
        if (this.state.unsavedChanges) {
            const clickedIndex = dialog.showMessageBox(
                {
                    message: "You have unsaved changes, do you want to discard them?",
                    title: caption,
                    buttons: ["Discard", "Cancel"], cancelId: 1
                });
            if (0 !== clickedIndex) {
                // not don't discard
                return false;
            }
        }
        // can discard changes
        return true;
    }

    newFile(e) {
        e.preventDefault();

        if (!this.canDiscardChanges("New File")) return; // there are unsaved changes we don't want to discard

        if (!this.state.unsavedChanges && this.state.validFileName) {
            const clickedIndex = dialog.showMessageBox(
                {
                    message: "Do you want to start with new data?",
                    buttons: ["New Data", "Cancel"], cancelId: 1
                });
            if (0 !== clickedIndex) {
                // not don't discard
                return false;
            }

        }

        this.setState(this.getDefaultState());
    }

    openFile(e) {
        e.preventDefault();
        const self = this;

        if (!this.canDiscardChanges("Open File")) return;

        dialog.showOpenDialog({ defaultPath: this.state.validFileName }, function (fileNames) {
            if (fileNames === undefined) {
                console.log("No file selected");
                return;
            }
            self.readFile(fileNames[0]);
        });
    }

    /**
     * read the XML configuration file
     * @param {string} filepath 
     */
    readFile(filepath) {
        const self = this;
        const path = filepath;
        Model.ReadFromFile(path, function (errString, data) {
            if (errString) {
                alert("An error ocurred reading the file :" + errString);
                return;
            }
            self.setState({ 
                user: data.user, 
                sites: data.sites, 
                
                validFileName: path, 
                hasCalculatedPW: false, 
                unsavedChanges: false, 
                importFromSites: null });
        });
    }

    saveAsFile(e) {
        e.preventDefault();

        const self = this;
        dialog.showSaveDialog({ defaultPath: this.state.validFileName }, function (fileName) {
            if (fileName === undefined) {
                console.log("No file selected");
                return;
            }
            self.performSave(fileName);
        });
    }

    saveFile(e) {
        e.preventDefault();
        if (this.state.validFileName) {
            this.performSave(this.state.validFileName);
        }
    }

    performSave(filepath) {
        const self = this;
        const path = filepath;
        Model.SaveToFile(path, new Model.Configuration(this.state.user, this.state.sites), function (errString) {
            if (errString) {
                alert("An error ocurred saving the file :" + errString);
            }
            else {
                self.setState({ validFileName: path, unsavedChanges: false });
                alert("Successfully saved to file " + path);
            }
        });
    }
    
    importFile(e) {
        e.preventDefault();

        // read the file, merge data and show import-preview
        const self = this;
        dialog.showOpenDialog({ defaultPath: this.state.validFileName }, function (fileNames) {
            if (fileNames === undefined) {
                console.log("No file selected");
                return;
            }
            var path = fileNames[0];
            Model.ReadFromFile(path, function (errString, data) {
                if (errString) {
                    alert("An error ocurred reading the file :" + errString);
                    return;
                }
                
                // now merge-preview
                if (data.user != self.state.user) {
                    // different user, don't merge.
                    alert("Cannot import/merge from the file because the user name is different. '" + data.user + "' != '" + self.state.user + "'");
                    return;
                }
                // now: find differences.
                var merged = Model.ImportSiteChanges(self.state.sites, data.sites);               
                self.setState({ importFromSites: merged });
            });
        });
    }

    importCancel(e) {
        e.preventDefault();
        this.setState({importFromSites: null});
    }

    importApplyFromAdded(event) {
        event.preventDefault();

        // move from importFromSites.added to sites
        const index = Number(event.target.value);

        this.setState((prevState, props) => {
            const addedSite = prevState.importFromSites.added[index];

            // remove from importFromSites
            var newAdded = prevState.importFromSites.added.slice(0); // duplicate
            newAdded.splice(index, 1); // change
            var newImportData = {...prevState.importFromSites};
            newImportData.added = newAdded;
            
            // add to sites
            var newSites = prevState.sites.slice();
            newSites.push(addedSite);

            return { importFromSites: newImportData, sites: newSites, unsavedChanges: true};
        });
    }

    importApplyFromNewer(event) {
        event.preventDefault();

        // update sites from importFromSites.newer, remove in newer
        const index = Number(event.target.value);
        
        this.setState((prevState, props) => {
            const newerSite = prevState.importFromSites.newer[index];

            // remove from importFromSites
            var newNewer = prevState.importFromSites.newer.slice(0); // duplicate
            newNewer.splice(index, 1); // change
            var newImportData = {...prevState.importFromSites};
            newImportData.newer = newNewer;
            
            // update to sites
            var newSites = prevState.sites.map((site, i) => {
                if (site.site === newerSite.site) {
                    // apply update: return new site from imported
                    return newerSite;
                } else {
                    return site;
                };
            });           

            return { importFromSites: newImportData, sites: newSites, unsavedChanges: true };
        });
    }

    importApplyFromConflicts(event) {
        event.preventDefault();

        // update sites from importFromSites.conflicts, remove in conflicts
        const index = Number(event.target.value);
        
        this.setState((prevState, props) => {
            const newerSite = prevState.importFromSites.conflicts[index];

            // remove from importFromSites
            var newConflicts = prevState.importFromSites.conflicts.slice(0); // duplicate
            newConflicts.splice(index, 1); // change
            var newImportData = {...prevState.importFromSites};
            newImportData.conflicts = newConflicts;
            
            // update to sites
            var newSites = prevState.sites.map((site, i) => {
                if (site.site === newerSite.site) {
                    // apply update: return new site from imported
                    return newerSite;
                } else {
                    return site;
                };
            });           

            return { importFromSites: newImportData, sites: newSites, unsavedChanges: true };
        });
    }

    // logic
    render() {
        // window title
        var title = "Electron MPW";
        title = this.state.validFileName ? title + " - " + this.state.validFileName : title;
        if (this.state.unsavedChanges) title += " *";
        document.title = title;

        // styles
        const paddingStyle = { paddingTop: "20px", paddingBottom: "20px" };
        const paddingBottom = { paddingBottom: "20px" };

        const saveDisabled = null === this.state.validFileName;

        return (
            <div className="container-fluid" style={paddingBottom}>
                <div className="btn-toolbar" style={paddingStyle} >
                    <button onClick={this.openFile} className="btn btn-primary">Open</button>
                    <div className="btn-group">
                        <button onClick={this.saveFile} className="btn btn-default" disabled={saveDisabled}>Save</button>
                        <button onClick={this.saveAsFile} className="btn btn-default">Save As</button>
                    </div>
                    <div className="btn-group pull-right">
                        <button onClick={this.newFile} className="btn btn-default">New</button>
                        <button onClick={this.importFile} className="btn btn-default">Import</button>
                    </div>
                </div>

                <MergePreview merged={this.state.importFromSites} cancel={this.importCancel} 
                    addFromAdded={this.importApplyFromAdded} 
                    updateFromNewer={this.importApplyFromNewer} 
                    updateFromConflicts={this.importApplyFromConflicts}/>

                <form className="form-horizontal">
                    <EditField label="User Name" value={this.state.user} valueChanged={this.userChanged} />
                    <EditField label="Master&nbsp;Key" value={this.state.masterpass} valueChanged={this.masterpassChanged} type="password" />
                </form>
                <div>
                    <SearchSites filterText={this.state.filterText} filterTextChanged={this.filterTextChanged} clearFilter={this.clearFilter} />
                </div>
                <Sites sites={this.state.sites}
                    filterText={this.state.filterText}
                    editSiteIndex={this.state.editSiteIndex}
                    editSite={this.editSite}
                    stopEditSite={this.stopEditSite}
                    sitePropertyChanged={this.sitePropertyChanged}
                    removeSite={this.removeSite}
                    addSite={this.addSite}
                    calcPW={this.calcPW}
                />
            </div>);
    }
}

ReactDOM.render(<App />, document.getElementById('app'));