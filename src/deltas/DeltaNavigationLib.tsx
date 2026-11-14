import { ComponentProps, ComponentType } from "react"

export function deltaDeferredNamedScreen<
    Name extends string,
    // Screen route props are intentionally heterogeneous.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Module extends Record<Name, ComponentType<any>>,
>(load: () => Module, exportName: Name) {
    type Screen = Module[Name]
    let Screen: Screen | undefined

    return function DeferredScreen(props: ComponentProps<Screen>) {
        Screen ??= load()[exportName]
        return <Screen {...props} />
    }
}