function readPackage(pkg, context) {
  if (
    pkg.name === '@atproto/oauth-client-expo' &&
    pkg.version === '0.0.10' &&
    pkg.dependencies?.['react-native-mmkv'] === '^3.3.3'
  ) {
    pkg.dependencies['react-native-mmkv'] =
      'npm:@bsky.app/react-native-mmkv@2.12.5'
    context.log(
      'patched @atproto/oauth-client-expo@0.0.10 react-native-mmkv -> npm:@bsky.app/react-native-mmkv@2.12.5',
    )
  }

  return pkg
}

module.exports = {
  hooks: {
    readPackage,
  },
}
