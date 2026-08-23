import {
    createContext,
    type PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['privatePostsEnabled']
type SetContext = (v: persisted.Schema['privatePostsEnabled']) => void

const stateContext = createContext<StateContext>(
    persisted.defaults.privatePostsEnabled,
)
const setContext = createContext<SetContext>(
    (_: persisted.Schema['privatePostsEnabled']) => { },
)

export function Provider({ children }: PropsWithChildren<{}>) {
    const [state, setState] = useState(persisted.get('privatePostsEnabled'))

    const setStateWrapped = useCallback(
        (value: persisted.Schema['privatePostsEnabled']) => {
            setState(value)
            persisted.write('privatePostsEnabled', value)
        },
        [setState],
    )

    useEffect(() => {
        return persisted.onUpdate('privatePostsEnabled', next => {
            setState(next)
        })
    }, [setStateWrapped])

    return (
        <stateContext.Provider value={state}>
            <setContext.Provider value={setStateWrapped}>
                {children}
            </setContext.Provider>
        </stateContext.Provider>
    )
}

export function usePrivatePostsEnabled() {
    return useContext(stateContext)
}

export function useSetPrivatePostsEnabled() {
    return useContext(setContext)
}
