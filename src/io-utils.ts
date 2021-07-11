import fs, { Dirent } from "fs";

export function findReleaseFile(
  releaseDir: string,
  fileRegex: string
): Dirent[] | undefined {
  return fs
    .readdirSync(releaseDir, { withFileTypes: true })
    .filter((item) => !item.isDirectory())
    .filter((item) => new RegExp(fileRegex).test(item.name));
}
