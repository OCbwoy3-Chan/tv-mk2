export function Provider({children}: {children: React.ReactNode}) {
  return children
}

export function useHotkeysContext() {
  return {
    enableScope: () => {},
    disableScope: () => {},
  }
}
