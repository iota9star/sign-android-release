"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findReleaseFile = void 0;
const fs_1 = __importDefault(require("fs"));
function findReleaseFile(releaseDir, fileRegex) {
    return fs_1.default
        .readdirSync(releaseDir, { withFileTypes: true })
        .filter((item) => !item.isDirectory())
        .filter((item) => new RegExp(fileRegex).test(item.name));
}
exports.findReleaseFile = findReleaseFile;
