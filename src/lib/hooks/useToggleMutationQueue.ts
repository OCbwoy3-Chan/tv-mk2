import {useCallback, useEffect, useRef, useState} from 'react'

type Task<TServerState> = {
  isOn: boolean
  resolve: (serverState: TServerState) => void
  reject: (e: unknown) => void
}

type TaskQueue<TServerState> = {
  activeTask: Task<TServerState> | null
  queuedTask: Task<TServerState> | null
  /** Keep server-confirmed state between drains, before React rerenders. */
  confirmedState: TServerState
}

function AbortError() {
  const e = new Error()
  e.name = 'AbortError'
  return e
}

export function useToggleMutationQueue<TServerState>({
  initialState,
  runMutation,
  onSuccess,
}: {
  initialState: TServerState
  runMutation: (
    prevState: TServerState,
    nextIsOn: boolean,
  ) => Promise<TServerState>
  onSuccess: (finalState: TServerState) => void
}) {
  // We use the queue as a mutable object.
  // This is safe becuase it is not used for rendering.
  const [queue] = useState<TaskQueue<TServerState>>({
    activeTask: null,
    queuedTask: null,
    confirmedState: initialState,
  })

  useEffect(() => {
    if (!queue.activeTask) {
      queue.confirmedState = initialState
    }
  }, [initialState, queue])

  async function processQueue() {
    if (queue.activeTask) {
      // There is another active processQueue call iterating over tasks.
      // It will handle any newly added tasks, so we should exit early.
      return
    }
    let previousTaskSucceeded = false
    try {
      while (queue.queuedTask) {
        const prevTask = queue.activeTask
        const nextTask = queue.queuedTask
        queue.activeTask = nextTask
        queue.queuedTask = null
        if (previousTaskSucceeded && prevTask?.isOn === nextTask.isOn) {
          // Skip multiple requests to update to the same value in a row.
          nextTask.resolve(queue.confirmedState)
          continue
        }
        try {
          // The state received from the server feeds into the next task.
          // This lets us queue deletions of not-yet-created resources.
          queue.confirmedState = await runMutation(
            queue.confirmedState,
            nextTask.isOn,
          )
          previousTaskSucceeded = true
          nextTask.resolve(queue.confirmedState)
        } catch (e) {
          previousTaskSucceeded = false
          nextTask.reject(e)
        }
      }
    } finally {
      onSuccess(queue.confirmedState)
      queue.activeTask = null
      queue.queuedTask = null
    }
  }

  function queueToggle(isOn: boolean): Promise<TServerState> {
    return new Promise((resolve, reject) => {
      // This is a toggle, so the next queued value can safely replace the queued one.
      if (queue.queuedTask) {
        queue.queuedTask.reject(new (AbortError as any)())
      }
      queue.queuedTask = {isOn, resolve, reject}
      void processQueue()
    })
  }

  const queueToggleRef = useRef(queueToggle)
  useEffect(() => {
    queueToggleRef.current = queueToggle
  })
  const queueToggleStable = useCallback(
    (isOn: boolean): Promise<TServerState> => {
      const queueToggleLatest = queueToggleRef.current
      return queueToggleLatest(isOn)
    },
    [],
  )
  return queueToggleStable
}
