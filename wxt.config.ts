import { defineConfig } from 'wxt';

export default defineConfig({
  manifestVersion: 3,
  webExt: {
    // Firefox Windows Store path — WXT passes this to web-ext as the firefox binary.
    binaries: {
      firefox: 'C:\\Users\\tejas\\AppData\\Local\\Microsoft\\WindowsApps\\firefox.exe',
    },
  },
  srcDir: 'src',
  outDir: '.output',

  manifest: {
    name: '1Click: Temp Mail with Autofill',
    version: '2.0.0',
    description: 'Generate temporary email addresses and auto-fill OTPs and login forms with one click.',
    browser_specific_settings: {
      gecko: {
        id: '1click-temp-mail@unarchive.tech'
      }
    },
    permissions: [
      'storage',
      'alarms',
      'notifications',
      'clipboardWrite',
      'scripting',
      'cookies',
    ],
    icons: {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "64": "icons/icon64.png",
      "128": "icons/icon128.png"
    },
    host_permissions: ['<all_urls>', 'https://burner.kiwi/*'],
    // Icons are auto-discovered from src/public/icons/ by WXT
    commands: {
      'autofill-form': {
        suggested_key: {
          default: 'Alt+Shift+F',
          mac: 'Alt+Shift+F',
        },
        description: 'Autofill the signup form on the current page',
      },
    },
  },
});
