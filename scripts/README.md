# Tool Scripts

## updateExtensions.sh

Updates the extensions in `/modules` with the current iOS/Android project changes.

## patch-package-to-pnpm.mjs
_(Witchsky-specific)_

Run this periodically when the upstream patches change, to update the patch files in the `patches` directory. This is a
custom script that generates patch files compatible with pnpm's patching system, which has some differences from the
standard `patch-package` format. It uses git to create the patches and ensures they are correctly formatted for pnpm.

Then, update patchedDependencies in `package.json` to remove version specifiers from patches that don't need them
(anything except @atproto/api, usually). That matches the `patch-package` behavior better.