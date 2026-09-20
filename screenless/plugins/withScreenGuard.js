const fs = require('fs');
const path = require('path');
const {
  withAndroidManifest,
  withEntitlementsPlist,
  withInfoPlist,
  withDangerousMod,
  AndroidConfig,
} = require('expo/config-plugins');

/**
 * Wires up Screen Guard at prebuild.
 *
 * Everything here is conditional on `extra.screenGuard === true` in app.json.
 * That switch is the whole compliance story: a build with the guard off ships
 * none of these permissions, none of the iOS entitlements and no extension, so
 * the ordinary Families-policy release is unchanged and
 * `scripts/check-release.mjs` still hard-fails if any of them appear by
 * accident. Turning the guard on is a deliberate, visible act with different
 * store paperwork behind it, documented in `store/SCREEN-GUARD.md`.
 *
 * Android gets:
 * - PACKAGE_USAGE_STATS and SYSTEM_ALERT_WINDOW, both "special access" rather
 *   than runtime permissions, so the user grants them by hand in Settings.
 * - FOREGROUND_SERVICE + FOREGROUND_SERVICE_SPECIAL_USE, because the watcher
 *   has to keep running while the app is closed.
 * - RECEIVE_BOOT_COMPLETED, so a limit survives a restart.
 * - QUERY_ALL_PACKAGES, so the parent can pick from the apps actually on the
 *   phone. This one carries a Play declaration; the justification is that a
 *   parental time limit is meaningless if the parent can only choose from a
 *   list we guessed in advance.
 *
 * Notably absent: BIND_ACCESSIBILITY_SERVICE. It is the usual shortcut for
 * knowing what is on screen and it is the one API Google genuinely restricts
 * to assistive use. Usage access does the same job inside policy.
 *
 * iOS gets the Family Controls entitlement, an App Group shared with the
 * monitor extension, and the extension target itself.
 */

const APP_GROUP = 'group.com.eminbakhishli.screenless.guard';

const ANDROID_PERMISSIONS = [
  'android.permission.PACKAGE_USAGE_STATS',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.QUERY_ALL_PACKAGES',
];

function isEnabled(config) {
  return config?.extra?.screenGuard === true;
}

/** Adds the permissions, and takes them back out of `blockedPermissions`. */
function withGuardAndroid(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    manifest['uses-permission'] = manifest['uses-permission'] || [];

    for (const name of ANDROID_PERMISSIONS) {
      const already = manifest['uses-permission'].find(
        (entry) => entry?.$?.['android:name'] === name,
      );
      if (!already) {
        manifest['uses-permission'].push({ $: { 'android:name': name } });
        continue;
      }
      // A permission this plugin owns that is *also* in `blockedPermissions`
      // arrives here already carrying `tools:node="remove"`, and the merger
      // honours the marker: the permission is declared, then deleted, and the
      // build ships without it. That is how SYSTEM_ALERT_WINDOW went missing
      // from 1.1.0 (versionCode 4) while everything still reported success —
      // the guard measured screen time and then could not draw the cover,
      // because `Settings.canDrawOverlays` cannot become true for a permission
      // that is not in the manifest, and a parent has no way to grant it.
      // The flag decides, so the flag wins.
      delete already.$['tools:node'];
    }

    // PACKAGE_USAGE_STATS is flagged as not-grantable by the build tools
    // unless it is marked. It is a special access permission; the user turns
    // it on in Settings and the app only ever reads it.
    const usage = manifest['uses-permission'].find(
      (entry) => entry?.$?.['android:name'] === 'android.permission.PACKAGE_USAGE_STATS',
    );
    if (usage) usage.$['tools:ignore'] = 'ProtectedPermissions';
    manifest.$ = manifest.$ || {};
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    return mod;
  });
}

/** The Family Controls entitlement and the App Group the extension shares. */
function withGuardIosEntitlements(config) {
  return withEntitlementsPlist(config, (mod) => {
    mod.modResults['com.apple.developer.family-controls'] = true;
    const groups = new Set(mod.modResults['com.apple.security.application-groups'] || []);
    groups.add(APP_GROUP);
    mod.modResults['com.apple.security.application-groups'] = [...groups];
    return mod;
  });
}

/**
 * Copies the monitor extension source next to the iOS project.
 *
 * The target itself still has to be added in Xcode once — Expo config plugins
 * cannot create an app extension target reliably across SDK versions, and
 * pretending otherwise would produce a build that fails confusingly. The
 * README beside the copied files says exactly what to do, and it is a
 * five minute job done once per clone.
 */
function withGuardIosExtension(config) {
  return withDangerousMod(config, [
    'ios',
    async (mod) => {
      const source = path.join(
        mod.modRequest.projectRoot,
        'modules',
        'screen-guard',
        'ios',
        'GuardMonitorExtension.swift',
      );
      const targetDir = path.join(mod.modRequest.platformProjectRoot, 'GuardMonitor');

      if (fs.existsSync(source)) {
        fs.mkdirSync(targetDir, { recursive: true });
        fs.copyFileSync(source, path.join(targetDir, 'GuardMonitorExtension.swift'));

        fs.writeFileSync(
          path.join(targetDir, 'Info.plist'),
          `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDisplayName</key>
  <string>ScreenLess Guard</string>
  <key>CFBundleIdentifier</key>
  <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
  <key>CFBundlePackageType</key>
  <string>XPC!</string>
  <key>NSExtension</key>
  <dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.deviceactivity.monitor-extension</string>
    <key>NSExtensionPrincipalClass</key>
    <string>$(PRODUCT_MODULE_NAME).GuardMonitorExtension</string>
  </dict>
</dict>
</plist>
`,
        );

        fs.writeFileSync(
          path.join(targetDir, 'GuardMonitor.entitlements'),
          `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.developer.family-controls</key>
  <true/>
  <key>com.apple.security.application-groups</key>
  <array>
    <string>${APP_GROUP}</string>
  </array>
</dict>
</plist>
`,
        );

        fs.writeFileSync(
          path.join(targetDir, 'README.md'),
          [
            '# GuardMonitor extension',
            '',
            'Generated by `plugins/withScreenGuard.js` on prebuild.',
            '',
            'A config plugin cannot reliably create an app extension target, so the',
            'target is added by hand once per clone:',
            '',
            '1. Open `ios/screenless.xcworkspace`.',
            '2. File > New > Target > Device Activity Monitor Extension.',
            '3. Name it **GuardMonitor**. Delete the stub files Xcode creates.',
            '4. Add `GuardMonitorExtension.swift` from this folder to the new target.',
            '5. Point the target at `Info.plist` and `GuardMonitor.entitlements` here.',
            '6. Set the deployment target to iOS 15.1 or later.',
            '',
            'The `com.apple.developer.family-controls` entitlement must be approved by',
            'Apple for the team before any of this runs on a device. Request it at',
            'https://developer.apple.com/contact/request/family-controls-distribution',
            '',
            'Until it is approved, `getCapability()` reports the feature as unavailable',
            'and the app falls back to the notice-only tier, which needs no entitlement.',
          ].join('\n'),
        );
      }

      return mod;
    },
  ]);
}

/** Copy explaining the Screen Time prompt, shown by iOS itself. */
function withGuardIosInfo(config) {
  return withInfoPlist(config, (mod) => {
    mod.modResults.NSFamilyControlsUsageDescription =
      'ScreenLess keeps the daily app limit a parent sets up in the app. It is never told which apps were chosen.';
    return mod;
  });
}

module.exports = function withScreenGuard(config) {
  if (!isEnabled(config)) {
    // The guard is compiled out. Nothing is added, and the release check will
    // still fail the build if any of these permissions turn up another way.
    return config;
  }

  let next = config;
  next = withGuardAndroid(next);
  next = withGuardIosEntitlements(next);
  next = withGuardIosInfo(next);
  next = withGuardIosExtension(next);
  return next;
};

module.exports.APP_GROUP = APP_GROUP;
module.exports.ANDROID_PERMISSIONS = ANDROID_PERMISSIONS;
