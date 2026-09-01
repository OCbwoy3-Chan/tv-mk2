export function usePhotoLibraryPermission() {
  const requestPhotoAccessIfNeeded = () => {
    // On the, we use <input type="file"> to produce a filepicker
    // This does not need any permission granting.
    return true
  }
  return {requestPhotoAccessIfNeeded}
}

export function useCameraPermission() {
  const requestCameraAccessIfNeeded = () => {
    return false
  }

  return {requestCameraAccessIfNeeded}
}

export function useVideoLibraryPermission() {
  const requestVideoAccessIfNeeded = () => {
    return true
  }

  return {requestVideoAccessIfNeeded}
}
