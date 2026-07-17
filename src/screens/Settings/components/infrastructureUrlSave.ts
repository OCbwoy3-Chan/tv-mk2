import {useCallback, useState} from 'react'
import {useLingui} from '@lingui/react/macro'

import * as Dialog from '#/components/Dialog'

export function useInfrastructureUrlSave({
  url,
  isUrlValid,
  testUrl,
  onSave,
  onClear,
  control,
}: {
  url: string
  isUrlValid: (url: string) => boolean
  testUrl: (url: string) => Promise<boolean>
  onSave: (normalizedUrl: string) => void
  onClear: () => void
  control: Dialog.DialogControlProps
}) {
  const {t: l} = useLingui()
  const [isTesting, setIsTesting] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)

  const trimmedUrl = url.trim()
  const isClear = trimmedUrl === ''
  const canSubmit = isClear || (isUrlValid(trimmedUrl) && !isTesting)

  const clearTestError = useCallback(() => setTestError(null), [])

  const submit = async () => {
    if (isClear) {
      control.close(() => {
        onClear()
      })
      return
    }

    if (!isUrlValid(trimmedUrl)) {
      return
    }

    setIsTesting(true)
    setTestError(null)
    try {
      const normalizedUrl = normalizeInfrastructureUrl(trimmedUrl)
      const works = await testUrl(normalizedUrl)
      if (!works) {
        setTestError(
          l`Couldn't reach this server. Check the URL and try again.`,
        )
        return
      }
      control.close(() => {
        onSave(normalizedUrl)
      })
    } catch {
      setTestError(
        l`Couldn't reach this server. Check the URL and try again.`,
      )
    } finally {
      setIsTesting(false)
    }
  }

  return {
    submit,
    isTesting,
    testError,
    canSubmit,
    isClear,
    clearTestError,
  }
}

export function normalizeInfrastructureUrl(url: string) {
  try {
    return new URL(url).origin
  } catch {
    return url
  }
}

export function normalizeOrigin(url: string | undefined) {
  try {
    return new URL(url ?? '').origin
  } catch {
    return null
  }
}

export function isValidHostnameUrl(url: string) {
  try {
    return new URL(url).hostname.includes('.')
  } catch {
    return false
  }
}

export function isValidPlcDirectoryUrl(url: string) {
  try {
    const nextUrl = new URL(url)
    return nextUrl.protocol === 'https:' || nextUrl.protocol === 'http:'
  } catch {
    return false
  }
}
