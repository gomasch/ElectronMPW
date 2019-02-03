// Copyright 2017 Martin Schmidt mail@gomasch.de
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// @ts-check
// React
const React = require('react');
const ReactDOM = require('react-dom');

// Clipboard
const { clipboard } = require('electron');

// Model
const { Site } = require('./model.js');

/**
 * Readable description for password type
 */
const PasswordTypeAsString = {
    "MaximumSecurityPassword": "Maximum Security",
    "LongPassword": "Long (13)",
    "MediumPassword": "Medium (8)",
    "BasicPassword": "Basic (8 simple)",
    "ShortPassword": "Short (4)",
    "PIN": "PIN (4)"
};

const fitToContentStyle = { 'whiteSpace': 'nowrap', 'width': '1%' };

/**
 * Edit a text-value as large scale (user, password name)
 * @param {*} props 
 */
function EditField(props) {
    const type = props.type || 'text';
    return (
        <div className="form-group">
            <label className="col-sm-2 control-label">{props.label}</label>
            <div className="col-sm-10">
                <input type={type} className="form-control" value={props.value} onChange={props.valueChanged} />
            </div>
        </div>
    );
}

/**
 * Edit search term
 * @param {*} props 
 */
function SearchSites(props) {
    return (
        <div className="pull-right">
            <input type="text" placeholder="Search..." value={props.filterText} onChange={props.filterTextChanged} />
            <button type="button" onClick={props.clearFilter}>x</button>
        </div>);
}

/**
 * Preview MergeResult
 * @param {*} props 
 */
function MergePreview(props) {
    if (null == props.merged) {
        return null;
    }
    return (<div className="container-fluid">
        <button onClick={props.cancel} className="btn btn-danger">Close Import</button>
        <table className="table table-bordered table-striped table-sm">
            <thead>
                <tr key={"head"}>
                    <th>Site</th>
                    <th>Counter</th>
                    <th>Type</th>
                    <th>Login</th>
                    <th style={fitToContentStyle}>Actions</th>
                </tr>
            </thead>
            <MergeRowsInteractive caption={"New in Import"} items={props.merged.added} btnCaption={"Add"} btnAction={props.addFromAdded}/>
            <MergeRowsInteractive caption={"Newer in Import"} items={props.merged.newer} btnCaption={"Update"} btnAction={props.updateFromNewer}/>
            <MergeRowsInteractive caption={"Conflicts"} items={props.merged.conflicts} btnCaption={"Use"} btnAction={props.updateFromConflicts} />
            <MergeRowsInteractive caption={"Unchanged"} items={props.merged.unchanged} />
            <MergeRowsInteractive caption={"Older in Import"} items={props.merged.older} />
            <MergeRowsInteractive caption={"Missing in Import"} items={props.merged.missing} />
        </table>
    </div>);
}

class MergeRowsInteractive extends React.Component {
    constructor(props) {
        super(props);
        this.state = { show: false };
        this.toggle = this.toggle.bind(this);
    }

    toggle(e) {
        e.preventDefault();
        this.setState((prevState, props) => ({ show: !prevState.show }));
    }

    render() {
        const items = this.props.items;
        if (items.length < 1) return null;
        const caption = this.props.caption;

        var rows = [];

        // header
        rows.push(<tr key={caption}>
            <th colSpan={4} key={caption}>{caption}: {items.length}</th><th><button onClick={this.toggle}>{!this.state.show ? "Show" : "Hide"}</button></th>
        </tr>);
        // content rows
        if (this.state.show) {
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                const index = i;
                var btn = null;
                if (this.props.btnCaption)
                {   // apply this item, identified by index
                    btn = <button onClick={this.props.btnAction} value={index}>{this.props.btnCaption}</button>;
                }
                rows.push(<tr key={caption + "_" + i}>
                    <td>{item.site}</td>
                    <td>{item.counter}</td>
                    <td>{PasswordTypeAsString[item.type]}</td>
                    <td>{item.login}</td>
                    <td>{btn}</td>
                </tr>);
            }
        }
        return (<tbody>{rows}</tbody>);
    }
};

/**
 * Table for password rows
 * @param {*} props 
 */
function Sites(props) {
    const filterText = props.filterText;
    const editSite = props.editSite;
    const selectedIndex = props.editSiteIndex;
    const unselectSite = props.stopEditSite;
    const sitePropertyChanged = props.sitePropertyChanged;
    const calcPW = props.calcPW;

    var found = 0;
    const specialIndexForSelected = props.sites.length + 10; // index is 0...

    const sites = props.sites.map((site, index) => {
        if (site.site.indexOf(filterText) === -1) {
            // not found (doesn't apply when filter text is empty)
            if (index === selectedIndex) {
                // we're editing this site, don't hide
            } else {
                // not found and we're not editing, hide it, don't add
                return;
            }
        }
        found++;
        const editBtnCaption = index === selectedIndex ? "Done" : "Edit"
        const siteRow = (<SiteRow key={index} site={site} index={index} editSite={editSite} btnName={editBtnCaption} calcPW={calcPW} pw={site.calculatedPW}
            sitePropertyChanged={props.sitePropertyChanged} />);
        if (index === selectedIndex) {
            return [
                siteRow,
                <SiteEditRow key={specialIndexForSelected} site={site} index={index}
                    sitePropertyChanged={sitePropertyChanged} removeSite={props.removeSite} doneEditSite={editSite} />
            ]; // we return multiple!
        }
        return siteRow;
    });
    return (
        <div>
            <div>
                <table className="table table-bordered table-striped table-sm">
                    <thead>
                        <HeaderRow found={found} count={props.sites.length} />
                    </thead>
                    <tbody>
                        {sites}
                    </tbody>
                </table>
                <button onClick={props.addSite} className="btn btn-default">Add Entry</button>
            </div>
        </div>
    );
}

// Helper for Sites

/**
 * Display the count of site - normal or with X / Y when found count is different
 */
function FoundCount(props) {
    const found = props.found;
    const count = props.count;
    if (found === count) return (<span>({count})</span>);
    return (<span>({found} / {count})</span>);
}

/**
 * Show password: as aterisks unless mouse hovers. with Copy and CalcPW buttons.
 */
class ShowPW extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hover: false };
        this.mouseOver = this.mouseOver.bind(this);
        this.mouseOut = this.mouseOut.bind(this);
        this.copyToClipboard = this.copyToClipboard.bind(this);
        this.clearPassword = this.clearPassword.bind(this);
    }
    mouseOver() {
        this.setState({ hover: true });
    }
    mouseOut() {
        this.setState({ hover: false });
    }
    copyToClipboard(e) {
        e.preventDefault();
        clipboard.writeText(this.props.value);
    }
    clearPassword(e) {
        e.preventDefault();
        this.props.sitePropertyChanged({ 'target': { id: this.props.index, name: 'calculatedPW', value: null } }); // index to be an integer
    }

    render() {
        const value = this.props.value;
        if (!value) {
            return (<button onClick={this.props.calcPW} value={this.props.index} className="btn btn-default btn-sm pull-right">Calc</button>); // pulled right
        }
        var display = this.state.hover ? value : Array(value.length + 1).join('*'); // show only when hovered with mouse, otherwise replace with aterisks

        const fixedWidthStyle = { 'fontF^amily': 'monospace' }; // prevent width change for mouse over with fixed width font
        return (<span className="pull-right">
            <span onMouseOver={this.mouseOver} onMouseOut={this.mouseOut} style={fixedWidthStyle}>{display} </span>
            <button onClick={this.copyToClipboard} className="btn btn-default btn-sm">Copy</button>
            <button onClick={this.props.calcPW} value={this.props.index} onContextMenu={this.clearPassword} className="btn btn-default btn-sm">Calc</button>
        </span>
        );
    }
};

/**
 * Table header row
 */
function HeaderRow(props) {
    const smallerStyle = { 'fontSize': '10px', 'verticalAlign': 'middle' };
    return (
        <tr>
            <th>Sites <FoundCount found={props.found} count={props.count} /></th>
            <th>Counter</th>
            <th>Type</th>
            <th>Login</th>
            <th>PW</th>
            <th>Actions</th>
        </tr>);
}

/**
 * Table normal site row
 */
function SiteRow(props) {
    return (
        <tr>
            <td>{props.site.site}</td>
            <td>{props.site.counter}</td>
            <td>{PasswordTypeAsString[props.site.type]}</td>
            <td>{props.site.login}</td>
            <td style={fitToContentStyle}> <ShowPW value={props.site.calculatedPW} calcPW={props.calcPW} index={props.index} sitePropertyChanged={props.sitePropertyChanged} /> </td>
            <td style={fitToContentStyle}><button onClick={props.editSite} value={props.index} className="btn btn-default btn-sm">{props.btnName}</button>
            </td>
        </tr>);
}

/**
 * Table extra site editing row
 */
function SiteEditRow(props) {
    return (
        <tr>
            <td colSpan={6}><EditSiteDetails {...props} /></td>
        </tr>);
}

/**
 * Form to edit site properties
 */
function EditSiteDetails(props) {
    return (
        <form className="form-horizontal">
            <EditSiteTextField label="Site" value={props.site.site} index={props.index} name="site" sitePropertyChanged={props.sitePropertyChanged} />
            <EditSiteTextField label="Counter" value={props.site.counter} index={props.index} type="number" name="counter" sitePropertyChanged={props.sitePropertyChanged} />
            <EditSiteType label="Type" value={props.site.type} index={props.index} name="type" sitePropertyChanged={props.sitePropertyChanged} />
            <EditSiteTextField label="Login" value={props.site.login} index={props.index} name="login" sitePropertyChanged={props.sitePropertyChanged} />
            <button onClick={props.removeSite} className="btn btn-danger pull-right" value={props.index}>Delete</button>
            <button onClick={props.doneEditSite} value={props.index} className="btn btn-default pull-right">Done</button>
        </form>
    );
}

/**
 * Edit site text property
 */
function EditSiteTextField(props) {
    const type = props.type || 'text';
    // sitePropertyChanged is a callback that queries target.id for the site index and target.name for the name of the value to edit
    return (
        <div className="form-group">
            <label className="col-sm-2 control-label">{props.label}</label>
            <div className="col-sm-10">
                <input type={type} className="form-control" value={props.value} id={props.index} name={props.name} onChange={props.sitePropertyChanged} />
            </div>
        </div>
    );
}

/**
 * Edit site password type
 */
function EditSiteType(props) {
    const type = props.type || 'text';
    // sitePropertyChanged is a callback that queries target.id for the site index and target.name for the name of the value to edit
    const options = Object.keys(PasswordTypeAsString).map((key) => (
        <option value={key} key={key}>{PasswordTypeAsString[key]}</option>));
    return (
        <div className="form-group">
            <label className="col-sm-2 control-label">{props.label}</label>
            <div className="col-sm-10">
                <select className="form-control" value={props.value} id={props.index} name={props.name} onChange={props.sitePropertyChanged}>
                    {options}
                </select>
            </div>
        </div>
    );
}

module.exports = { EditField, SearchSites, Sites, MergePreview };