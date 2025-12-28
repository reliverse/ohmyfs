#!/usr/bin/env bun

import { $ } from "bun";
import clipboard from "clipboardy";

/**
 * Release script for ohmyfs
 * Bumps versions in package.json, Cargo.toml, and tauri.conf.json
 * Then builds the application for specified platforms (or all platforms if none specified)
 *
 * Usage:
 *   bun run release.ts [options]
 *
 * Options:
 *   --bump [major|minor|patch]  Bump version (defaults to patch if no value)
 *   --target <platform>         Build for specific platform(s) (comma-separated or multiple flags)
 *                               Valid: windows, linux, macos-intel, macos-arm
 *   --dry-run                   Show what would be done without making changes
 */

// Regex for matching version lines in Cargo.toml
const VERSION_REGEX = /^version = "[^"]*"/m;

// Build targets configuration
const BUILD_TARGETS: BuildTarget[] = [
  {
    name: "windows",
    target: "x86_64-pc-windows-msvc",
    runner: "cargo-xwin",
    getInstallerName: (version: string) => `ohmyfs_${version}_x64-setup.exe`,
    displayName: "Windows 10/11 64-bit",
  },
  {
    name: "linux",
    target: "x86_64-unknown-linux-gnu",
    getInstallerName: (version: string) => `ohmyfs_${version}_amd64.AppImage`,
    displayName: "Linux 64-bit",
  },
  {
    name: "macos-intel",
    target: "x86_64-apple-darwin",
    getInstallerName: (version: string) => `ohmyfs_${version}_x64.dmg`,
    displayName: "macOS Intel 64-bit",
  },
  {
    name: "macos-arm",
    target: "aarch64-apple-darwin",
    getInstallerName: (version: string) => `ohmyfs_${version}_aarch64.dmg`,
    displayName: "macOS Apple Silicon",
  },
];

type BumpType = "major" | "minor" | "patch";

interface Version {
  major: number;
  minor: number;
  patch: number;
}

interface BuildTarget {
  name: string;
  target: string;
  runner?: string;
  getInstallerName: (version: string) => string;
  displayName: string;
}

function parseVersion(version: string): Version {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return {
    major: parts[0],
    minor: parts[1],
    patch: parts[2],
  };
}

function bumpVersion(version: Version, bumpType: BumpType): Version {
  switch (bumpType) {
    case "major":
      return { major: version.major + 1, minor: 0, patch: 0 };
    case "minor":
      return { major: version.major, minor: version.minor + 1, patch: 0 };
    case "patch":
      return {
        major: version.major,
        minor: version.minor,
        patch: version.patch + 1,
      };
    default:
      throw new Error(`Unknown bump type: ${bumpType}`);
  }
}

function formatVersion(version: Version): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

async function updatePackageJson(newVersion: string): Promise<void> {
  const packageJsonPath = "package.json";
  // biome-ignore lint/correctness/noUndeclaredVariables: Bun is a global in Bun runtime
  const packageJson = JSON.parse(await Bun.file(packageJsonPath).text());
  packageJson.version = newVersion;
  // biome-ignore lint/correctness/noUndeclaredVariables: Bun is a global in Bun runtime
  await Bun.write(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
  console.log(`✓ Updated ${packageJsonPath} to version ${newVersion}`);
}

async function updateCargoToml(newVersion: string): Promise<void> {
  const cargoTomlPath = "src-tauri/Cargo.toml";
  // biome-ignore lint/correctness/noUndeclaredVariables: Bun is a global in Bun runtime
  let content = await Bun.file(cargoTomlPath).text();

  // Update the version line
  content = content.replace(VERSION_REGEX, `version = "${newVersion}"`);

  // biome-ignore lint/correctness/noUndeclaredVariables: Bun is a global in Bun runtime
  await Bun.write(cargoTomlPath, content);
  console.log(`✓ Updated ${cargoTomlPath} to version ${newVersion}`);
}

async function updateTauriConfJson(newVersion: string): Promise<void> {
  const tauriConfPath = "src-tauri/tauri.conf.json";
  // biome-ignore lint/correctness/noUndeclaredVariables: Bun is a global in Bun runtime
  const tauriConf = JSON.parse(await Bun.file(tauriConfPath).text());
  tauriConf.version = newVersion;
  // biome-ignore lint/correctness/noUndeclaredVariables: Bun is a global in Bun runtime
  await Bun.write(tauriConfPath, `${JSON.stringify(tauriConf, null, 2)}\n`);
  console.log(`✓ Updated ${tauriConfPath} to version ${newVersion}`);
}

async function getCurrentVersion(): Promise<string> {
  // biome-ignore lint/correctness/noUndeclaredVariables: Bun is a global in Bun runtime
  const packageJson = JSON.parse(await Bun.file("package.json").text());
  return packageJson.version;
}

async function buildForTarget(
  target: BuildTarget,
  dryRun: boolean
): Promise<void> {
  console.log(`🔨 Building for ${target.displayName}...`);

  const args = target.runner
    ? [
        "run",
        "tauri",
        "build",
        "--runner",
        target.runner,
        "--target",
        target.target,
      ]
    : ["run", "tauri", "build", "--target", target.target];

  const command = `bun ${args.join(" ")}`;

  if (dryRun) {
    console.log(`🔍 [DRY RUN] Would run: ${command}`);
  } else {
    try {
      await $`bun ${args}`;
      console.log(`✅ Successfully built for ${target.displayName}`);
    } catch (error) {
      console.error(`❌ Failed to build for ${target.displayName}:`, error);
      throw error;
    }
  }
}

function parseTargets(args: string[]): string[] | undefined {
  const targetIndices: number[] = [];
  for (let index = 0; index < args.length; index++) {
    if (args[index] === "--target") {
      targetIndices.push(index);
    }
  }

  if (targetIndices.length === 0) {
    return undefined;
  }

  const targets: string[] = [];
  for (const index of targetIndices) {
    const targetValue = args[index + 1];
    if (targetValue && !targetValue.startsWith("--")) {
      // Support comma-separated targets
      targets.push(...targetValue.split(",").map((t) => t.trim()));
    }
  }

  // Validate targets
  const validTargetNames = BUILD_TARGETS.map((t) => t.name);
  const invalidTargets = targets.filter((t) => !validTargetNames.includes(t));
  if (invalidTargets.length > 0) {
    throw new Error(
      `Invalid target(s): ${invalidTargets.join(", ")}. Valid targets: ${validTargetNames.join(", ")}`
    );
  }

  // Remove duplicates
  return [...new Set(targets)];
}

function parseBumpType(args: string[]): BumpType | undefined {
  const bumpIndex = args.indexOf("--bump");
  if (bumpIndex === -1) {
    return undefined;
  }

  const bumpValue = args[bumpIndex + 1];
  if (!bumpValue || bumpValue.startsWith("--")) {
    // --bump without value or followed by another flag defaults to patch
    return "patch";
  }

  const validBumpTypes: BumpType[] = ["major", "minor", "patch"];
  if (!validBumpTypes.includes(bumpValue as BumpType)) {
    throw new Error(
      `Invalid bump type: ${bumpValue}. Must be one of: ${validBumpTypes.join(", ")}`
    );
  }

  return bumpValue as BumpType;
}

function parseArgs(): {
  bumpType?: BumpType;
  dryRun: boolean;
  targets?: string[];
} {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const bumpType = parseBumpType(args);
  const targets = parseTargets(args);

  return { bumpType, dryRun, targets };
}

async function main() {
  try {
    console.log("🚀 Starting ohmyfs release process...\n");

    const { bumpType, dryRun, targets } = parseArgs();
    let finalVersion: string;

    // Filter targets to build
    const targetsToBuild = targets
      ? BUILD_TARGETS.filter((target) => targets.includes(target.name))
      : BUILD_TARGETS;

    if (dryRun) {
      console.log(
        "🔍 Running in dry-run mode - no actual changes will be made\n"
      );
    }

    if (bumpType) {
      console.log(`📦 Bumping version (${bumpType})...`);

      const currentVersion = await getCurrentVersion();
      const version = parseVersion(currentVersion);
      const newVersion = bumpVersion(version, bumpType);
      const newVersionString = formatVersion(newVersion);
      finalVersion = newVersionString;

      console.log(`Current version: ${currentVersion}`);
      console.log(`New version: ${newVersionString}\n`);

      if (dryRun) {
        console.log("🔍 [DRY RUN] Would update version files\n");
      } else {
        // Update all version files
        await updatePackageJson(newVersionString);
        await updateCargoToml(newVersionString);
        await updateTauriConfJson(newVersionString);
      }
    } else {
      console.log("📦 Skipping version bump (--bump not provided)\n");
      finalVersion = await getCurrentVersion();
    }

    console.log(
      `🔨 Building application for ${targetsToBuild.length} platform(s)...\n`
    );

    // Build for each target
    for (const target of targetsToBuild) {
      await buildForTarget(target, dryRun);
    }

    console.log("\n✅ Release completed successfully!");

    // Generate release content with downloads for built platforms
    const downloadLinks = targetsToBuild
      .map(
        (target) =>
          `- [${target.displayName}](https://github.com/ohmyfs/launcher/releases/download/${finalVersion}/${target.getInstallerName(finalVersion)})`
      )
      .join("\n");

    const releaseContent = `## Downloads

${downloadLinks}`;

    if (dryRun) {
      console.log("🔍 [DRY RUN] Would copy to clipboard:");
      console.log(releaseContent);
    } else {
      await clipboard.write(releaseContent);
      console.log("📋 Release content copied to clipboard!");
    }
  } catch (error) {
    console.error("\n❌ Release failed:", error);
    process.exit(1);
  }
}

main();
