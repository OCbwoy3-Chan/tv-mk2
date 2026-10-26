import 'array.prototype.findlast/auto'
import 'array.prototype.findlastindex/auto'
import 'setimmediate'

if (typeof globalThis.requestIdleCallback !== 'function') {
  globalThis.requestIdleCallback = callback =>
    window.setTimeout(() => {
      const start = performance.now()
      callback({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (performance.now() - start)),
      })
    }, 1)

  globalThis.cancelIdleCallback = handle => window.clearTimeout(handle)
}

/*
 * NOTE: the webpack-era console.error wrapper that re-threw react-native-web's
 * "Unexpected text node" warnings as redboxes was removed with the Metro
 * migration. Metro's LogBox already surfaces console.error prominently, and
 * any wrapper around console.error becomes the top stack frame of every
 * captured error, making Metro attribute all of them to this file.
 */

export {}
