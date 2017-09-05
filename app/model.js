// @ts-check

const fs = require('fs');
const et = require('elementtree');

const SupportedPasswordTypes = [
    "MaximumSecurityPassword",
    "LongPassword",
    "MediumPassword",
    "ShortPassword",
    "BasicPassword",
    "PIN"
];

/**
* @class Configuration
* @classdesc Masterpassword configuration.
* @param {string} user name of the user
* @param {Site[]} sites sites
*/
function Configuration(user, sites) {
    this.user = user || "";
    this.sites = sites || [];  // { site: "", counter: 1, type: "LongPassword", login: "" }                
};

/**
* @class Configuration
* @classdesc Masterpassword configuration.
* @param {string} site name of the site
* @param {number} [counter] counter, default 1
* @param {string} [type] type of the password
* @param {string} [login] login, information only
*/
function Site(site, counter, type, login) {
    this.site = site;
    this.counter = counter || 1;
    this.type = type || "LongPassword";
    this.login = login || "";
    // { site: "", counter: 1, type: "LongPassword", login: "" }
};

/**
 * read and parse XML file
 * @param {string} filepath path to file
 * @param {function(string, Configuration)} errDataCallback receives the data or the error msg
 */
function ReadFromFile(filepath, errDataCallback) {
    const callback = errDataCallback;
    fs.readFile(filepath, 'utf-8', function (err, data) {
        if (err) {
            callback(err.message, null);
            return;
        }
        try {
            var newConfig = {
                user: "",
                sites: [
                    // { site: "", counter: 1, type: "LongPassword", login: "" }
                ]
            };
            var etree = et.parse(data);
            newConfig.user = etree.find("UserName").text;
            var sites = etree.findall('Sites/Site');
            var site;
            for (site of sites) {
                var siteName = site.find('SiteName').text;
                var counter = site.find('Counter').text;
                var type = site.find('Type').text;
                var login = site.find('Login').text;
                newConfig.sites.push({ site: siteName, counter: counter, type: type, login: login });
            }

            callback(null, newConfig);
        } catch (error) {
            callback("file import failed: " + error, null);
        }
    });
}

/**
 * read and parse XML file
 * @param {string} filepath path to file
 * @param {Configuration} config data so save
 * @param {function(NodeJS.ErrnoException)} errCallback callback for error reporting, null when all OK
 */
function SaveToFile(filepath, config, errCallback) {
    var root = et.Element("MasterPassword");
    var user = et.SubElement(root, "UserName");
    user.text = config.user;

    var sites = et.SubElement(root, "Sites");
    var site;
    for (site of config.sites) {
        var xmlSite = et.SubElement(sites, "Site");
        et.SubElement(xmlSite, "SiteName").text = site.site;
        et.SubElement(xmlSite, "Counter").text = site.counter;
        et.SubElement(xmlSite, "Login").text = site.login;
        et.SubElement(xmlSite, "Type").text = site.type;
    }

    var doc = new et.ElementTree(root);
    var xml = doc.write({ indent: 2 });

    fs.writeFile(filepath, xml, errCallback);
}

/**
* @class MergedSites
* @classdesc result of the import-merge operation
*/
function MergedSites() {
    /** @member {Site[]} unchanged same in both */
    this.unchanged = []; // sites
    this.added = []; // in imported (so: would be added in new)
    this.missing = []; // in imported (so: no action, we assume it has been added here but not there)
    this.older = []; // in imported (so: no action)
    this.newer = []; // in imported (so: would be updated)
    this.conflicts = []; // unclear what is better
};

/**
 * Import/Merge sites: unchanged, added (in imported), missing (in imported), older (in imported), newer (in imported)
 * @param {Site[]} current the current sites
 * @param {Site[]} imported imported sites
 * @returns {MergedSites} import result
 */
function ImportSiteChanges(current, imported) {
    var result = new MergedSites();

    var partners = imported.slice(); // duplicate

    for (var i = 0; i < current.length; i++) {
        const site = current[i];
        var partner = null;
        // find partner
        for (var j = 0; j < partners.length; j++) {
            const potentialPartner = partners[j];
            if (site.site === potentialPartner.site) {
                // found in imported
                partner = potentialPartner;
                partners.splice(j, 1); // remove it from the partners
                break;
            }
        }
        if (null == partner) {
            // no partner - missing
            result.missing.push(site);
        }
        else if (site.type === partner.type && site.counter === partner.counter && site.login === partner.login) {
            // all the same - unchanged
            result.unchanged.push(site);
        } else {
            // conflict - show partner
            if (site.counter != partner.counter) {
                // we just assume higher counter = newer
                if (Number(partner.counter) > Number(site.counter)) {
                    // partner is newer
                    result.newer.push(partner);
                } else {
                    result.older.push(partner);
                }
            }
            else {
                // same counter
                if (site.type !== partner.type) {
                    // different types? no chance to resolve this
                    result.conflicts.push(partner);
                }
                else {
                    // only login is different
                    if (partner.login.length > site.login.length) {
                        // partner string longer, probably newer?
                        result.newer.push(partner);                        
                    } else if (partner.login.length < site.login.length) {
                        // partner string shorter, probably older?
                        result.older.push(partner);
                    } else {
                        // who knows...
                        result.conflicts.push(partner);
                    }
                }
            }
        }
    }

    // remaining in partners: are added in imported
    for (var j = 0; j < partners.length; j++) {
        result.added.push(partners[j]);
    }

    return result;
}

module.exports.SaveToFile = SaveToFile;
module.exports.ReadFromFile = ReadFromFile;
module.exports.Configuration = Configuration;
module.exports.Site = Site;
module.exports.ImportSiteChanges = ImportSiteChanges;
