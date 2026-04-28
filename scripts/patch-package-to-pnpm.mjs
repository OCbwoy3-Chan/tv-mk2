#!/usr/bin/env -S node
/* eslint-disable import-x/no-nodejs-modules */
// @ts-check

// https://github.com/karlhorky/pnpm-tricks#convert-patch-package-patches-to-pnpm-patches

/**
 * Convert patch-package patches to pnpm-native patches by:
 *
 * 1. Group all patch-package patches by package name
 * 2. For non-overlapping patches: strip prefixes and
 *    concatenate
 * 3. For overlapping patches (same file in multiple patches):
 *    download the original package, apply patches sequentially,
 *    and generate a squashed diff
 * 4. Write a patch file: patches/<@scope__name>.patch
 * 5. Update pnpm.patchedDependencies in package.json with a
 *    version-qualified key
 *
 * Original patch files not deleted, to allow for comparison.
 */

import { execSync } from 'node:child_process'
import { readFile, writeFile, cp, rm, mkdtemp, mkdir } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import util from 'node:util'

import glob from 'glob'

const globAsync = util.promisify(glob)

const rootDir = process.cwd()
const patchesDir = path.join(rootDir, 'patches')
const packageJsonPath = path.join(rootDir, 'package.json')

const patchPackagePatchPaths = (await globAsync('*+*.patch', { cwd: patchesDir }))
    .map(
        (file) => path.join(patchesDir, file),
    )
patchPackagePatchPaths.sort()

if (patchPackagePatchPaths.length === 0) {
    console.log(`No patch-package patches found in ${patchesDir}.`)
    process.exit(1)
}

const packageJsonContent = /** @type {{ pnpm?: { patchedDependencies?: Record<string, string> } }} */ (JSON.parse(
    await readFile(packageJsonPath, 'utf8'),
))
packageJsonContent.pnpm ??= {}
packageJsonContent.pnpm.patchedDependencies ??= {}

/**
 * Parse a patch-package filename to extract package info.
 *
 * Handles formats like:
 *   react-native+0.81.5.patch
 *   react-native+0.81.5+001+initial.patch
 *   @atproto+api+0.14.21.patch
 *   parent++child+1.0.0.patch
 *
 * @param {string} filePath
 */
function parsePatchFilename(filePath) {
    const base = path.basename(filePath, '.patch')

    // Handle parent++leaf separation
    let parentEncoded
    let leafPart = base
    const parentSepIndex = base.indexOf('++')
    if (parentSepIndex !== -1) {
        parentEncoded = base.slice(0, parentSepIndex)
        leafPart = base.slice(parentSepIndex + 2)
    }

    // Split by '+' and find the version (first segment starting with a digit)
    const segments = leafPart.split('+')
    let versionIndex = -1
    for (let i = 1; i < segments.length; i++) {
        if (/^\d/.test(segments[i])) {
            versionIndex = i
            break
        }
    }

    if (versionIndex < 1) {
        return null
    }

    const encodedLeafName = segments.slice(0, versionIndex).join('+')
    // @scope+name -> @scope/name
    const leafPackageName = encodedLeafName.replaceAll('+', '/')

    const parentPackageName = parentEncoded
        ? parentEncoded.replaceAll('+', '/')
        : undefined

    const nodeModulesPathPrefix = (
        parentPackageName ? [parentPackageName, leafPackageName] : [leafPackageName]
    )
        .map((segment) => `node_modules/${segment}`)
        .join('/')

    return {
        leafPackageName,
        encodedLeafName,
        nodeModulesPathPrefix,
    }
}

// Group patches by leaf package name
/** @type {Map<string, { encodedLeafName: string, nodeModulesPathPrefix: string, paths: string[] }>} */
const patchGroups = new Map()

for (const patchPath of patchPackagePatchPaths) {
    const parsed = parsePatchFilename(patchPath)
    if (!parsed) {
        console.error(
            `Skipping ${patchPath}: cannot parse filename`,
        )
        continue
    }

    if (!patchGroups.has(parsed.leafPackageName)) {
        patchGroups.set(parsed.leafPackageName, { ...parsed, paths: [] })
    }
    patchGroups.get(parsed.leafPackageName).paths.push(patchPath)
}

/**
 * Extract the set of files modified by a patch.
 * @param {string} patchContent
 * @returns {Set<string>}
 */
function getModifiedFiles(patchContent) {
    const files = new Set()
    for (const match of patchContent.matchAll(/^diff --git a\/(.+?) b\//gm)) {
        files.add(match[1])
    }
    return files
}

/**
 * Check if multiple patches modify any of the same files.
 * @param {string[]} patchPaths
 * @param {string} nodeModulesPathPrefix
 * @returns {Promise<boolean>}
 */
async function hasOverlappingFiles(patchPaths, nodeModulesPathPrefix) {
    const allFiles = new Set()
    for (const patchPath of patchPaths) {
        const content = await readFile(patchPath, 'utf8')
        const stripped = content.replaceAll(`a/${nodeModulesPathPrefix}/`, 'a/')
        for (const file of getModifiedFiles(stripped)) {
            if (allFiles.has(file)) return true
            allFiles.add(file)
        }
    }
    return false
}

for (const [leafPackageName, group] of patchGroups) {
    const packageDir = path.join(rootDir, 'node_modules', ...leafPackageName.split('/'))

    // Read installed version for the version-qualified key
    let installedVersion
    try {
        const installedPkgJson = JSON.parse(
            await readFile(path.join(packageDir, 'package.json'), 'utf8'),
        )
        installedVersion = installedPkgJson.version
    } catch {
        console.warn(
            `Could not resolve installed version for ${leafPackageName}`,
        )
    }

    const overlapping = group.paths.length > 1 &&
        await hasOverlappingFiles(group.paths, group.nodeModulesPathPrefix)

    let pnpmPatchContent

    if (!overlapping) {
        // Simple path: strip node_modules prefix and concatenate
        const convertedParts = []
        for (const patchPath of group.paths) {
            const content = await readFile(patchPath, 'utf8')
            const converted = content
                .replaceAll(`a/${group.nodeModulesPathPrefix}/`, 'a/')
                .replaceAll(`b/${group.nodeModulesPathPrefix}/`, 'b/')
            convertedParts.push(converted)
        }
        pnpmPatchContent = convertedParts.join('')
    } else {
        // Overlapping patches: download original, apply sequentially, squash
        if (!installedVersion) {
            console.error(
                `Cannot squash overlapping patches for ${leafPackageName}: unknown installed version`,
            )
            continue
        }

        const pkgSegments = leafPackageName.split('/')
        const stripLevel = 2 + pkgSegments.length

        const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'pnpm-patch-'))
        const originalDir = path.join(tmpDir, 'original')
        const patchedDir = path.join(tmpDir, 'patched')

        try {
            // Download original package tarball
            console.log(`Downloading ${leafPackageName}@${installedVersion}...`)
            execSync(
                `npm pack "${leafPackageName}@${installedVersion}" --pack-destination "${tmpDir.replaceAll('\\', '/')}"`,
                { stdio: 'pipe' },
            )

            // Find the tarball (npm creates <scope-less-name>-<version>.tgz)
            const tarballs = (await util.promisify(glob)('*.tgz', { cwd: tmpDir }))
            if (tarballs.length === 0) {
                throw new Error(`No tarball found after npm pack for ${leafPackageName}`)
            }
            const tarballPath = path.join(tmpDir, tarballs[0]).replaceAll('\\', '/')

            // Extract to both original and patched dirs
            await mkdir(originalDir, { recursive: true })
            await mkdir(patchedDir, { recursive: true })
            execSync(
                `tar xzf "${tarballPath}" -C "${originalDir.replaceAll('\\', '/')}" --strip-components=1`,
                { stdio: 'pipe' },
            )
            execSync(
                `tar xzf "${tarballPath}" -C "${patchedDir.replaceAll('\\', '/')}" --strip-components=1`,
                { stdio: 'pipe' },
            )

            // Apply each patch in sequence to the patched copy
            for (const patchPath of group.paths) {
                const gitPatchPath = patchPath.replaceAll('\\', '/')
                try {
                    execSync(
                        `git apply -p${stripLevel} --ignore-whitespace "${gitPatchPath}"`,
                        { cwd: patchedDir, stdio: 'pipe' },
                    )
                } catch (/** @type {any} */ e) {
                    const stderr = e.stderr?.toString() || ''
                    console.error(`Warning: patch may not have applied cleanly: ${path.basename(patchPath)}`)
                    console.error(stderr)
                    // Try with more lenient settings
                    execSync(
                        `git apply -p${stripLevel} --ignore-whitespace -C0 "${gitPatchPath}"`,
                        { cwd: patchedDir, stdio: 'pipe' },
                    )
                }
            }

            // Generate a single squashed diff
            const gitOriginalDir = originalDir.replaceAll('\\', '/')
            const gitPatchedDir = patchedDir.replaceAll('\\', '/')
            let diff
            try {
                execSync(
                    `git diff --no-ext-diff --no-index -- "${gitOriginalDir}" "${gitPatchedDir}"`,
                    { encoding: 'utf8', stdio: 'pipe', maxBuffer: 50 * 1024 * 1024 },
                )
                console.log(`No differences found for ${leafPackageName}, skipping`)
                continue
            } catch (/** @type {any} */ e) {
                if (e.status === 1) {
                    diff = /** @type {string} */ (e.stdout)
                } else {
                    throw e
                }
            }

            // Replace temp dir paths with standard a/ b/ prefixes
            pnpmPatchContent = diff
                .replaceAll(`a/${gitOriginalDir}/`, 'a/')
                .replaceAll(`b/${gitPatchedDir}/`, 'b/')
                .replaceAll(`${gitOriginalDir}/`, '')
                .replaceAll(`${gitPatchedDir}/`, '')
        } finally {
            await rm(tmpDir, { recursive: true, force: true })
        }
    }

    // @scope+name -> @scope__name
    const pnpmPatchPath = path.join(
        patchesDir,
        `${group.encodedLeafName.replaceAll('+', '__')}.patch`,
    )
    await writeFile(pnpmPatchPath, pnpmPatchContent)

    const patchedDepKey = installedVersion
        ? `${leafPackageName}@${installedVersion}`
        : leafPackageName

    packageJsonContent.pnpm.patchedDependencies[patchedDepKey] = path
        .relative(rootDir, pnpmPatchPath)
        .replaceAll('\\', '/')

    const patchNames = group.paths.map((p) => path.relative(rootDir, p))
    console.log(
        `${overlapping ? 'Squashed' : 'Converted'} ${group.paths.length} patch(es) for ${leafPackageName}: ${patchNames.join(', ')}`,
    )
}

await writeFile(
    packageJsonPath,
    JSON.stringify(packageJsonContent, null, 2) + '\n',
)
console.log(
    "All patches squashed to pnpm patches. Run 'pnpm install' to apply.",
)