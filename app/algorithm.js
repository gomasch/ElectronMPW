// Copyright 2017 Martin Schmidt mail@gomasch.de
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// This implements a portion of the Master Password algorithm from Maarten Billemont http://masterpasswordapp.com/.

// @ts-check
const scrypt_module_factory = require('./../external/js-scrypt/scrypt.js');

/**
 * All steps of the master password algorithm at once
 * @param {string} userName 
 * @param {string} masterPassword
 * @param {string} siteName 
 * @param {Number} counter 
 * @param {String} typeOfPassword from model.SupportedPasswordTypes
 * @param {function(string, string|void):void} callback (err, calculatedPassword)
*/
function AllSteps(userName, masterPassword, siteName, counter, typeOfPassword, callback) {
    CalcMasterKey(userName, masterPassword, function (err, masterKey) {
        if (err) {
            callback(err);
        } else {
            CalcTemplateSeed(masterKey, siteName, counter, function (err, siteSeed) {
                if (err) {
                    callback(err);
                }
                else {
                    var sitePassword = CalcPassword(siteSeed, typeOfPassword);
                    callback(null, sitePassword);
                }
            });
        }
    });
}

/**
 * Create Master Key
 * @param {string} userName 
 * @param {string} masterPassword
 * @param {function(string, Uint8Array):void} callback (err, data)
 */
function CalcMasterKey(userName, masterPassword, callback) {
    var masterBytes = encode_utf8(masterPassword);
    var salt = CombineUint8Arrays(encode_utf8("com.lyndir.masterpassword"), Uint32ToUint8ArraysBigEndian(userName.length), encode_utf8(userName));
    scrypt_module_factory(function (scrypt) {
        var result = scrypt.crypto_scrypt(masterBytes, salt, 32768, 8, 2, 64);
        callback(null, result);
    }, { requested_total_memory: 64 * 1024 * 1024 });
}

/**
 * Calculate Template Seed
 * @param {Uint8Array} masterkey 
 * @param {string} siteName 
 * @param {Number} counter 
 * @param {function(string, Uint8Array):void} callback (err, data)
 */
function CalcTemplateSeed(masterkey, siteName, counter, callback) {
    var key = masterkey;
    var data = CombineUint8Arrays(
        encode_utf8("com.lyndir.masterpassword"),
        Uint32ToUint8ArraysBigEndian(siteName.length),
        encode_utf8(siteName),
        Uint32ToUint8ArraysBigEndian(counter));

    // use built-in HMAC-SHA256
    window.crypto.subtle.importKey(
        "raw", key, {
            name: "HMAC",
            hash: {
                name: "SHA-256"
            }
        }, false/*not extractable*/, ["sign"])
        .then(
            function (wKey) {
                var b = window.crypto.subtle.sign({
                    name: "HMAC",
                    hash: {
                        name: "SHA-256"
                    }
                }, wKey, data)
                    .then(
                        result => callback(null, new Uint8Array(result)),
                        err => callback(err, null));
            }, 
            err => callback(err, null)
        );
}

/**
 * Calculate the actual password for the site based on its seed and the password type
 * @param {Uint8Array} templateSeedForPassword 
 * @param {String} typeOfPassword from model.SupportedPasswordTypes
 * @returns {String} calculated password
 */
function CalcPassword(templateSeedForPassword, typeOfPassword) {
    var template = TemplateForType[typeOfPassword];

    var subTemplate = template[templateSeedForPassword[0] % template.length];

    return subTemplate.split("").map(function (c, i) {
        var chars = CharacterGroup[c];
        return chars[templateSeedForPassword[i + 1] % chars.length];
    }).join("");
}

/**
 * Password template per type
 */
var TemplateForType = {
    MaximumSecurityPassword: [
        "anoxxxxxxxxxxxxxxxxx",
        "axxxxxxxxxxxxxxxxxno"
    ],
    LongPassword: [
        "CvcvnoCvcvCvcv",
        "CvcvCvcvnoCvcv",
        "CvcvCvcvCvcvno",
        "CvccnoCvcvCvcv",
        "CvccCvcvnoCvcv",
        "CvccCvcvCvcvno",
        "CvcvnoCvccCvcv",
        "CvcvCvccnoCvcv",
        "CvcvCvccCvcvno",
        "CvcvnoCvcvCvcc",
        "CvcvCvcvnoCvcc",
        "CvcvCvcvCvccno",
        "CvccnoCvccCvcv",
        "CvccCvccnoCvcv",
        "CvccCvccCvcvno",
        "CvcvnoCvccCvcc",
        "CvcvCvccnoCvcc",
        "CvcvCvccCvccno",
        "CvccnoCvcvCvcc",
        "CvccCvcvnoCvcc",
        "CvccCvcvCvccno"
    ],
    MediumPassword: [
        "CvcnoCvc",
        "CvcCvcno"
    ],
    BasicPassword: [
        "aaanaaan",
        "aannaaan",
        "aaannaaa"
    ],
    ShortPassword: [
        "Cvcn"
    ],
    PIN: [
        "nnnn"
    ]
};

/**
 * Characters for char in password templates.
 */
var CharacterGroup = {
    V: "AEIOU",
    C: "BCDFGHJKLMNPQRSTVWXYZ",
    v: "aeiou",
    c: "bcdfghjklmnpqrstvwxyz",
    A: "AEIOUBCDFGHJKLMNPQRSTVWXYZ",
    a: "AEIOUaeiouBCDFGHJKLMNPQRSTVWXYZbcdfghjklmnpqrstvwxyz",
    n: "0123456789",
    o: "@&%?,=[]_:-+*$#!'^~;()/.",
    x: "AEIOUaeiouBCDFGHJKLMNPQRSTVWXYZbcdfghjklmnpqrstvwxyz0123456789!@#$%^&*()"
};

var encoder = new TextEncoder();

/**
 * Encode string as utf-8
 * @param {string} s String to encode
 * @returns {Uint8Array} utf-8 bytes
 */
function encode_utf8(s) {
    return encoder.encode(s);
}

/**
 * Concatenate multiple Uint8Array arrays into one
 * @param {Uint8Array} [array1] The arrays to concatenate
 * @param {Uint8Array} [array2] The arrays to concatenate
 * @param {Uint8Array} [array3] The arrays to concatenate
 * @param {Uint8Array} [array4] The arrays to concatenate
 * @param {Uint8Array} [array5] The arrays to concatenate
 * @returns {Uint8Array} concatenates array
 */
function CombineUint8Arrays(array1, array2, array3, array4, array5) {
    var overallLength = 0;
    for (var i = 0; i < arguments.length; ++i) {
        overallLength += arguments[i].length;
    }

    var result = new Uint8Array(overallLength);
    var offset = 0;
    for (var i = 0; i < arguments.length; ++i) {
        var arr = arguments[i];
        result.set(arr, offset);
        offset += arr.length;
    }

    return result;
}

/**
 * Encode a 32-bit unsigned integer in network byte order (big endian)
 * @param {number} value The value to encode
 * @returns {Uint8Array} bytes
 */
function Uint32ToUint8ArraysBigEndian(value) {
    //32-bit unsigned integer in network byte order. (big endian)
    var result = new ArrayBuffer(4);
    var dv = new DataView(result);
    dv.setUint32(0, value, false); // false => big endian
    return new Uint8Array(result);
}

module.exports.CalcMasterKey = CalcMasterKey;
module.exports.CalcTemplateSeed = CalcTemplateSeed;
module.exports.CalcPassword = CalcPassword;
module.exports.AllSteps = AllSteps;
