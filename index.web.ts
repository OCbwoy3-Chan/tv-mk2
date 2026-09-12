import '#/platform/markBundleStartTime'
import '#/platform/polyfills'

import {registerRootComponent} from 'expo'

import App from '#/App'

registerRootComponent(App)

if (!__DEV__ && 'serviceWorker' in navigator) {
  const register = () => {
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.warn('Unable to register the service worker', error)
    })
  }
  if (document.readyState === 'complete') {
    register()
  } else {
    window.addEventListener('load', register, {once: true})
  }
}
