/**
 * Points the Android release build at the upload keystore.
 *
 * `expo prebuild` regenerates `android/` from scratch and ships a release build
 * signed with the *debug* key, which Play rejects. Editing the generated gradle
 * by hand works until the next prebuild wipes it, so the wiring lives here
 * instead and is reapplied every time.
 *
 * The keystore itself and its password stay in `credentials/`, which is
 * gitignored. With that folder absent, the build falls back to debug signing and
 * still succeeds, so a fresh clone can build and run without any secrets.
 */

const { withAppBuildGradle } = require('expo/config-plugins');

const RELEASE_SIGNING_CONFIG = `        release {
            def props = new Properties()
            def propsFile = rootProject.file('../credentials/keystore.properties')
            if (propsFile.exists()) {
                propsFile.withInputStream { props.load(it) }
                storeFile rootProject.file("../credentials/\${props['storeFile']}")
                storePassword props['storePassword']
                keyAlias props['keyAlias']
                keyPassword props['keyPassword']
            }
        }`;

const DEBUG_LINE = 'signingConfig signingConfigs.debug';
const RELEASE_LINE =
  "signingConfig rootProject.file('../credentials/keystore.properties').exists() ? signingConfigs.release : signingConfigs.debug";

function withUploadSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;

    if (gradle.includes(RELEASE_LINE)) return cfg;

    // 1. Add a `release` signing config next to the generated `debug` one.
    const debugConfig = /(signingConfigs \{\s*debug \{[\s\S]*?\n\s{8}\})/;
    if (!debugConfig.test(gradle)) {
      throw new Error('withUploadSigning: could not find the debug signingConfig block');
    }
    gradle = gradle.replace(debugConfig, `$1\n${RELEASE_SIGNING_CONFIG}`);

    // 2. Point the *release build type* at it. Sliced rather than matched with a
    //    regex: `signingConfigs { release { ... } }` now also contains the word
    //    `release`, and a lazy match from there runs straight into the debug
    //    build type's line, silently signing release builds with the debug key.
    const buildTypesAt = gradle.indexOf('buildTypes {');
    if (buildTypesAt === -1) throw new Error('withUploadSigning: no buildTypes block');

    const head = gradle.slice(0, buildTypesAt);
    const buildTypes = gradle.slice(buildTypesAt);

    const releaseAt = buildTypes.indexOf('release {');
    if (releaseAt === -1) throw new Error('withUploadSigning: no release build type');

    const beforeRelease = buildTypes.slice(0, releaseAt);
    const releaseBlock = buildTypes.slice(releaseAt);
    if (!releaseBlock.includes(DEBUG_LINE)) {
      throw new Error('withUploadSigning: release build type has no debug signingConfig to replace');
    }

    cfg.modResults.contents =
      head + beforeRelease + releaseBlock.replace(DEBUG_LINE, RELEASE_LINE);
    return cfg;
  });
}

module.exports = withUploadSigning;
