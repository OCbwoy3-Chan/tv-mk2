## Hermes archive directory prefix

React Native 0.88 only strips the `facebook-hermes-` directory from the GitHub
source archive. GitHub now returns a `meta-hermes-` directory, leaving
`CMakeLists.txt` one level too deep and breaking Android builds from source.
Accept both prefixes so the build also works with older archives.

Remove this patch when upgrading to a React Native version that handles the new
archive prefix.
