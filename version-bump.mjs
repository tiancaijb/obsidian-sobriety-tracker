import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.argv[2]?.replace(/^v/, '');
if (!targetVersion) {
	console.error("Usage: node version-bump.mjs <new-version>");
	process.exit(1);
}

// Read manifest.json
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;

// Update versions.json
const versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t") + "\n");

// Update manifest.json
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t") + "\n");

console.log(`Bumped to ${targetVersion} (minAppVersion: ${minAppVersion})`);
