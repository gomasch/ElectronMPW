// Copyright 2017-2019 Martin Schmidt mail@gomasch.de
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var assert = require('assert');
var model = require('./../app/model.js');

describe('ImportSiteChanges()', function () {
    it('should rate all added if original empty', function () {
        var current = [];
        var imported = [];
        imported.push(new model.Site("site1", "1", "LongPassword", ""));
        imported.push(new model.Site("site2", "2", "LongPassword", ""));

        var merged = model.ImportSiteChanges(current, imported);

        // all added
        assert.equal(0, merged.missing.length);
        assert.equal(0, merged.newer.length);
        assert.equal(0, merged.older.length);
        assert.equal(0, merged.unchanged.length);
        assert.equal(2, merged.added.length);
        assert.equal(0, merged.conflicts.length);
    });
    it('should rate the added ones as added', function () {
        var current = [];
        current.push(new model.Site("site1", "1", "LongPassword", "loginx"));
        current.push(new model.Site("site2", "2", "LongPassword", "loginy"));

        var imported = [];
        imported.push(new model.Site("site1", "1", "LongPassword", "loginx"));
        imported.push(new model.Site("site12", "1", "LongPassword", "login12"));
        imported.push(new model.Site("site2", "2", "LongPassword", "loginy"));

        var merged = model.ImportSiteChanges(current, imported);

        // 1 added
        assert.equal(0, merged.missing.length);
        assert.equal(0, merged.newer.length);
        assert.equal(0, merged.older.length);
        assert.equal(2, merged.unchanged.length);
        assert.equal(1, merged.added.length);
        assert.equal("site12", merged.added[0].site);
        assert.equal("login12", merged.added[0].login);
        assert.equal(0, merged.conflicts.length);

        // in-data unchanged
        assert.equal(2, current.length);        
        assert.equal(3, imported.length);        
    });    
    it('should rate all missing if imported empty', function () {
        var current = [];
        current.push(new model.Site("site1", "1", "LongPassword", ""));
        current.push(new model.Site("site2", "2", "LongPassword", ""));
        var imported = [];

        var merged = model.ImportSiteChanges(current, imported);

        // all added
        assert.equal(2, merged.missing.length);
        assert.equal(0, merged.newer.length);
        assert.equal(0, merged.older.length);
        assert.equal(0, merged.unchanged.length);
        assert.equal(0, merged.added.length);
        assert.equal(0, merged.conflicts.length);
    });
    it('should rate all unchanged if equal', function () {
        var current = [];
        current.push(new model.Site("site1", "1", "LongPassword", "loginx"));
        current.push(new model.Site("site2", "2", "LongPassword", "loginy"));

        var imported = [];
        imported.push(new model.Site("site1", "1", "LongPassword", "loginx"));
        imported.push(new model.Site("site2", "2", "LongPassword", "loginy"));

        var merged = model.ImportSiteChanges(current, imported);

        // all added
        assert.equal(0, merged.missing.length);
        assert.equal(0, merged.newer.length);
        assert.equal(0, merged.older.length);
        assert.equal(2, merged.unchanged.length);
        assert.equal(0, merged.added.length);
        assert.equal(0, merged.conflicts.length);
    });
    it('should rate all unchanged even if order different', function () {
        var current = [];
        current.push(new model.Site("site2", "2", "LongPassword", "x"));
        current.push(new model.Site("site1", "1", "LongPassword", "y"));
        var imported = [];
        imported.push(new model.Site("site1", "1", "LongPassword", "y"));
        imported.push(new model.Site("site2", "2", "LongPassword", "x"));

        var merged = model.ImportSiteChanges(current, imported);

        // all added
        assert.equal(0, merged.missing.length);
        assert.equal(0, merged.newer.length);
        assert.equal(0, merged.older.length);
        assert.equal(2, merged.unchanged.length);
        assert.equal(0, merged.added.length);
        assert.equal(0, merged.conflicts.length);
    });
    it('should rate higher counter as newer', function () {
        var current = [];
        current.push(new model.Site("site1", "1", "LongPassword", "loginx"));
        current.push(new model.Site("site2", "2", "LongPassword", "loginy"));

        var imported = [];
        imported.push(new model.Site("site1", "1", "LongPassword", "loginx"));
        imported.push(new model.Site("site2", "3", "LongPassword", "loginy"));

        var merged = model.ImportSiteChanges(current, imported);

        // all added
        assert.equal(0, merged.missing.length);
        assert.equal(1, merged.newer.length);
        assert.equal("3", merged.newer[0].counter);
        assert.equal(0, merged.older.length);
        assert.equal(1, merged.unchanged.length);
        assert.equal(0, merged.added.length);
        assert.equal(0, merged.conflicts.length);
    });
    it('should rate lower counter as older', function () {
        var current = [];
        current.push(new model.Site("site1", "1", "LongPassword", "loginx"));
        current.push(new model.Site("site2", "2", "LongPassword", "loginy"));

        var imported = [];
        imported.push(new model.Site("site1", "1", "LongPassword", "loginx"));
        imported.push(new model.Site("site2", "1", "LongPassword", "loginy"));

        var merged = model.ImportSiteChanges(current, imported);

        // all added
        assert.equal(0, merged.missing.length);
        assert.equal(0, merged.newer.length);
        assert.equal(1, merged.older.length);
        assert.equal("1", merged.older[0].counter);
        assert.equal(1, merged.unchanged.length);
        assert.equal(0, merged.added.length);
        assert.equal(0, merged.conflicts.length);
    });
    it('should rate longer login as newer', function () {
        var current = [];
        current.push(new model.Site("site1", "1", "LongPassword", "loginx"));
        current.push(new model.Site("site2", "2", "LongPassword", "xc"));

        var imported = [];
        imported.push(new model.Site("site1", "1", "LongPassword", "loginx"));
        imported.push(new model.Site("site2", "2", "LongPassword", "loginy"));

        var merged = model.ImportSiteChanges(current, imported);

        // all added
        assert.equal(0, merged.missing.length);
        assert.equal(1, merged.newer.length);
        assert.equal("site2", merged.newer[0].site);
        assert.equal("loginy", merged.newer[0].login);
        assert.equal(0, merged.older.length);
        assert.equal(1, merged.unchanged.length);
        assert.equal(0, merged.added.length);
        assert.equal(0, merged.conflicts.length);
    });
    it('should rate shorter login as older', function () {
        var current = [];
        current.push(new model.Site("site1", "1", "LongPassword", "loginx"));
        current.push(new model.Site("site2", "2", "LongPassword", "loginy"));

        var imported = [];
        imported.push(new model.Site("site1", "1", "LongPassword", "loginx"));
        imported.push(new model.Site("site2", "2", "LongPassword", "login"));

        var merged = model.ImportSiteChanges(current, imported);

        // all added
        assert.equal(0, merged.missing.length);
        assert.equal(0, merged.newer.length);
        assert.equal(1, merged.older.length);
        assert.equal("site2", merged.older[0].site);
        assert.equal("login", merged.older[0].login);
        assert.equal(1, merged.unchanged.length);
        assert.equal(0, merged.added.length);
        assert.equal(0, merged.conflicts.length);
    });
    it('should rate different types as conflict', function () {
        var current = [];
        current.push(new model.Site("site1", "1", "LongPassword", "loginx"));
        current.push(new model.Site("site2", "2", "PIN", "loginy"));

        var imported = [];
        imported.push(new model.Site("site1", "1", "LongPassword", "loginx"));
        imported.push(new model.Site("site2", "2", "LongPassword", "loginy"));

        var merged = model.ImportSiteChanges(current, imported);

        // all added
        assert.equal(0, merged.missing.length);
        assert.equal(0, merged.newer.length);
        assert.equal(0, merged.older.length);
        assert.equal(1, merged.unchanged.length);
        assert.equal(0, merged.added.length);
        assert.equal(1, merged.conflicts.length);
        assert.equal("site2", merged.conflicts[0].site);
        assert.equal("LongPassword", merged.conflicts[0].type);
    });
});
