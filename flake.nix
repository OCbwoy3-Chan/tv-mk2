{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    android-nixpkgs.url = "github:tadfisher/android-nixpkgs";
    wrangler-flake.url = "github:ryand56/wrangler";
  };

  outputs = {
    nixpkgs,
    flake-utils,
    wrangler-flake,
    android-nixpkgs,
    ...
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        noEmulator = (builtins.getEnv "NO_EMULATOR") == "1";

        android-arch =
          if system == "aarch64-darwin"
          then "arm64-v8a"
          else "x86-64";
        android-arch-underline =
          if system == "aarch64-darwin"
          then "arm64-v8a"
          else "x86_64";

        pkgs = import nixpkgs {
          inherit system;
          config = {
            android_sdk.accept_license = true;
            allowUnfree = true;
          };
        };
        pinnedJDK = pkgs.jdk17;
        androidSdk = android-nixpkgs.sdk.${system} (
          sdk:
            with sdk;
              [
                build-tools-35-0-0
                cmdline-tools-latest
                platform-tools
                platforms-android-36
                sources-android-36
                ndk-27-1-12297006
                cmake-3-22-1
              ]
              ++ pkgs.lib.optionals (!noEmulator) [
                emulator
                sdk."system-images-android-36-google-apis-${android-arch}"
                sdk."system-images-android-36-google-apis-playstore-${android-arch}"
              ]
        );

        create-avd = pkgs.writeShellScriptBin "create-avd" ''
          avdmanager create avd \
            --name android-36 \
            --package 'system-images;android-36;google_apis_playstore;${android-arch-underline}' \
            --tag google_apis_playstore \
            --device pixel_8 \
            --force
        '';
      in
        with pkgs; {
          packages = {
            default = callPackage ./default.nix {};
          };
          devShells = {
            default = mkShell rec {
              buildInputs = [
                androidSdk
                pinnedJDK
              ];

              JAVA_HOME = pinnedJDK;
              ANDROID_HOME = "${androidSdk}/share/android-sdk";
              ANDROID_SDK_ROOT = "${androidSdk}/share/android-sdk";


              packages =
                [
                  gradle_8

                  just
                  fastmod
                  nodejs
                  yarn
                  crowdin-cli
                  eas-cli

                  bundletool

                  typescript
                  typescript-language-server

                  go
                  gopls

                  wrangler-flake.packages.${system}.wrangler
                ]
                ++ pkgs.lib.optionals (!noEmulator) [create-avd];

              shellHook = ''
                export GRADLE_USER_HOME=~/.cache/gradle
                if [[ ${system} =~ .*-darwin ]]; then
	                export ANDROID_USER_HOME="~/.android"
                else
                        export ANDROID_USER_HOME="''${XDG_STATE_HOME:-$HOME/.local/state}/android"
                fi
                export ANDROID_AVD_HOME="$ANDROID_USER_HOME/avd"
                export GRADLE_OPTS="-Dorg.gradle.project.android.aapt2FromMavenOverride=${ANDROID_SDK_ROOT}/build-tools/35.0.0/aapt2''${GRADLE_OPTS:+ $GRADLE_OPTS}";
              '';
            };
          };
        }
    );
}
