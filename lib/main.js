"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const signing_1 = require("./signing");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const io = __importStar(require("./io-utils"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (process.env.DEBUG_ACTION === "true") {
                core.info("DEBUG FLAG DETECTED, SHORTCUTTING ACTION.");
                return;
            }
            const releaseDir = core.getInput("releaseDirectory");
            const fileRegex = core.getInput("fileRegex");
            const signingKeyBase64 = core.getInput("signingKeyBase64");
            const alias = core.getInput("alias");
            const keyStorePassword = core.getInput("keyStorePassword");
            const keyPassword = core.getInput("keyPassword");
            core.info(`Preparing to sign key @ ${releaseDir} with signing key`);
            // 1. Find release file
            const releaseFiles = io.findReleaseFile(releaseDir, fileRegex);
            if (releaseFiles !== undefined && releaseFiles.length > 0) {
                core.info(`Found release to sign: ${releaseFiles.map((it) => it.name).join(", ")}`);
                // 3. Now that we have a release file, decode and save the signing key
                const signingKey = path_1.default.join(releaseDir, "signingKey.jks");
                fs_1.default.writeFileSync(signingKey, signingKeyBase64, "base64");
                let signedReleaseFiles = [];
                for (let releaseFile of releaseFiles) {
                    // 4. Now zipalign the release file
                    const releaseFilePath = path_1.default.join(releaseDir, releaseFile.name);
                    let signedReleaseFile;
                    if (releaseFile.name.endsWith(".apk")) {
                        signedReleaseFile = yield signing_1.signApkFile(releaseFilePath, signingKey, alias, keyStorePassword, keyPassword);
                    }
                    else if (releaseFile.name.endsWith(".aab")) {
                        signedReleaseFile = yield signing_1.signAabFile(releaseFilePath, signingKey, alias, keyStorePassword, keyPassword);
                    }
                    if (signedReleaseFile) {
                        signedReleaseFiles.push(signedReleaseFile);
                    }
                }
                core.info(`Release signed! ${signedReleaseFiles}`);
                core.exportVariable("SIGNED_RELEASE_FILES", signedReleaseFiles);
                core.setOutput("signedReleaseFiles", signedReleaseFiles);
            }
            else {
                core.error("No release file (.apk or .aab) could be found. Abort.");
                core.setFailed("No release file (.apk or .aab) could be found.");
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
