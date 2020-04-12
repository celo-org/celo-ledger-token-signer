"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var elliptic_1 = require("elliptic");
var ec = new elliptic_1.ec('secp256k1');
var hw_transport_node_hid_1 = __importDefault(require("@ledgerhq/hw-transport-node-hid"));
var hw_app_eth_1 = __importDefault(require("@ledgerhq/hw-app-eth"));
var print_key_1 = require("./print_key");
var keyPath = "44'/52752'/0'/0/0";
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var transport, eth, pubKey, key;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, hw_transport_node_hid_1["default"].create()];
                case 1:
                    transport = _a.sent();
                    eth = new hw_app_eth_1["default"](transport);
                    return [4 /*yield*/, eth.getAddress(keyPath)];
                case 2:
                    pubKey = (_a.sent()).publicKey;
                    key = ec.keyFromPublic(pubKey, 'hex');
                    console.log('Hex key:');
                    console.log(pubKey);
                    console.log('\n');
                    console.log('Formatted key:');
                    console.log(print_key_1.formatKey(key));
                    return [2 /*return*/];
            }
        });
    });
}
run()
    .then(function () { })["catch"](function (e) { return console.error(e); });
