import * as core from "@actions/core";
import { signAabFile, signApkFile } from "./signing";
import path from "path";
import fs from "fs";
import * as io from "./io-utils";

async function run() {
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
      core.info(
        `Found release to sign: ${releaseFiles.map((it) => it.name).join(", ")}`
      );

      // 3. Now that we have a release file, decode and save the signing key
      const signingKey = path.join(releaseDir, "signingKey.jks");
      fs.writeFileSync(signingKey, signingKeyBase64, "base64");

      let signedReleaseFiles: string[] = [];

      for (let releaseFile of releaseFiles) {
        // 4. Now zipalign the release file
        const releaseFilePath = path.join(releaseDir, releaseFile.name);
        let signedReleaseFile;
        if (releaseFile.name.endsWith(".apk")) {
          signedReleaseFile = await signApkFile(
            releaseFilePath,
            signingKey,
            alias,
            keyStorePassword,
            keyPassword
          );
        } else if (releaseFile.name.endsWith(".aab")) {
          signedReleaseFile = await signAabFile(
            releaseFilePath,
            signingKey,
            alias,
            keyStorePassword,
            keyPassword
          );
        }
        if (signedReleaseFile) {
          signedReleaseFiles.push(signedReleaseFile);
        }
      }

      core.info(`Release signed! ${signedReleaseFiles}`);
      core.exportVariable("SIGNED_RELEASE_FILES", signedReleaseFiles);
      core.setOutput("signedReleaseFiles", signedReleaseFiles);
    } else {
      core.error("No release file (.apk or .aab) could be found. Abort.");
      core.setFailed("No release file (.apk or .aab) could be found.");
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
