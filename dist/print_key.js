"use strict";
exports.__esModule = true;
function formatKey(key) {
    var publicKey = key.getPublic();
    var x = publicKey.getX().toBuffer();
    var y = publicKey.getY().toBuffer();
    var xStr = '';
    for (var i = 0; i < x.length; i++) {
        xStr += '0x' + x[i].toString(16) + ',';
        if (i % 8 == 7) {
            xStr += '\n';
        }
    }
    var yStr = '';
    for (var i = 0; i < y.length; i++) {
        yStr += '0x' + y[i].toString(16);
        if (i != y.length - 1) {
            yStr += ',';
        }
        if (i % 8 == 7) {
            yStr += '\n';
        }
    }
    return "0x04,\n\n" + xStr + "\n\n" + yStr;
}
exports.formatKey = formatKey;
