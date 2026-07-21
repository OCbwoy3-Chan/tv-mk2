export PATH := "./node_modules/.bin:" + env_var('PATH')

# lots of just -> pnpm, but this lets us chain pnpm command deps

[group('dist')]
dist-build-web: intl build-web

[group('dist')]
dist-build-android-sideload: intl build-android-sideload

[group('dist')]
dist-build-android-gradle: intl build-android-gradle

[group('build')]
intl:
    pnpm intl:build

[group('build')]
prebuild-android:
    expo prebuild -p android

[group('build')]
build-web: && postbuild-web
    pnpm build-web

[group('build')]
build-android-sideload: prebuild-android
    eas build --local --platform android --profile sideload-android

[group('build')]
[working-directory: 'android']
build-android-gradle: prebuild-android
    ./gradlew --no-daemon app:assembleRelease

[group('build')]
postbuild-web:
    # build system outputs some srcs and hrefs like src="static/"
    # need to rewrite to be src="/static/" to handle non root pages
    sed -i 's/\(src\|href\)="static/\1="\/static/g' web-build/index.html

    # we need to copy the static iframe html to support youtube embeds
    cp -r bskyweb/static/iframe/ web-build/iframe
    # copy well-known files to support app deeplinks too
    cp -r bskyweb/static/.well-known/ web-build/.well-known
    # copy files to support oauth
    cp bskyweb/static/oauth-client-metadata.json web-build/oauth-client-metadata.json
    cp bskyweb/static/oauth-client-metadata-native.json web-build/oauth-client-metadata-native.json

    # copy static info pages over!
    cp -r witchsky-static-about web-build/about
    
    # copy a stylesheet
    cp src/style.css web-build/style.css
    cp src/style.css web-build/static/style.css

    # copy the favicon
    cp assets/favicon.png web-build/favicon.ico

[group('dev')]
dev-android-setup: prebuild-android
    pnpm android

[group('dev')]
dev-web:
    pnpm web

[group('dev')]
dev-web-functions: build-web
    wrangler pages dev ./web-build

[group('lint')]
typecheck:
    pnpm typecheck
