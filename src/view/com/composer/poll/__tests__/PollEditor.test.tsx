import {type useEffect, useReducer, type useRef} from 'react'
import {fireEvent, render} from '@testing-library/react-native'

import {
  composerReducer,
  type ComposerState,
  createComposerState,
  type PostAction,
} from '#/view/com/composer/state/composer'

type ReactHooks = {useEffect: typeof useEffect; useRef: typeof useRef}

jest.mock('@lingui/react', () => {
  const format = (
    message:
      {message?: string; values?: Record<string, string | number>} | string,
  ) => {
    if (typeof message === 'string') return message
    return (message.message ?? '').replace(/{(\w+)}/g, (_, key: string) =>
      String(message.values?.[key] ?? ''),
    )
  }
  return {
    useLingui: () => ({_: format, t: format}),
    Trans: ({
      id,
      message,
      values,
    }: {
      id: string
      message?: string
      values?: Record<string, string | number>
    }) => format({message: message ?? id, values}),
  }
})
jest.mock('#/alf', () => {
  const blank = new Proxy({}, {get: () => ({})})
  return {
    atoms: blank,
    useTheme: () => ({
      atoms: blank,
      palette: new Proxy({}, {get: (target, key) => String(key)}),
    }),
  }
})
jest.mock('#/components/Typography', () => {
  const {Text} = require('react-native')
  return {Text}
})
jest.mock('#/components/icons/Poll', () => ({
  Poll_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/forms/DateTimeField', () => {
  const {Text} = require('react-native')
  return {
    DateTimeField: ({value, testID}: {value: string; testID: string}) => (
      <Text testID={testID}>{value}</Text>
    ),
    utils: jest.requireActual('#/components/forms/DateTimeField/utils'),
  }
})
jest.mock('#/components/icons/Check', () => ({
  Check_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/Clock', () => ({
  Clock_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/Chevron', () => ({
  ChevronBottom_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/Menu', () => {
  const {Pressable, Text, View} = require('react-native')
  return {
    Root: ({children}: {children: React.ReactNode}) => <View>{children}</View>,
    Outer: ({children}: {children: React.ReactNode}) => <View>{children}</View>,
    Group: ({children}: {children: React.ReactNode}) => <View>{children}</View>,
    ItemText: ({children}: {children: React.ReactNode}) => (
      <Text>{children}</Text>
    ),
    ItemRadio: () => null,
    ItemIcon: () => null,
    Trigger: ({
      children,
      label,
    }: {
      children: (p: {
        props: object
        state: {hovered: boolean; pressed: boolean}
      }) => React.ReactNode
      label: string
    }) =>
      children({
        props: {accessibilityLabel: label},
        state: {hovered: false, pressed: false},
      }),
    Item: ({
      children,
      label,
      onPress,
      testID,
    }: {
      children: React.ReactNode
      label: string
      onPress: () => void
      testID: string
    }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint=""
        testID={testID}
        onPress={onPress}>
        {children}
      </Pressable>
    ),
  }
})
jest.mock('#/components/icons/Times', () => ({
  TimesLarge_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/Button', () => {
  const {Pressable, Text} = require('react-native')
  return {
    Button: ({
      children,
      label,
      onPress,
      testID,
    }: {
      children: React.ReactNode
      label: string
      onPress: () => void
      testID?: string
    }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint=""
        onPress={onPress}
        testID={testID}>
        {children}
      </Pressable>
    ),
    ButtonText: ({children}: {children: React.ReactNode}) => (
      <Text>{children}</Text>
    ),
    ButtonIcon: () => null,
  }
})

const mockInputLifecycle = jest.fn()
jest.mock('#/components/forms/TextField', () => {
  const hooks = jest.requireActual<ReactHooks>('react')
  const {TextInput} = require('react-native')
  return {
    Root: ({children}: {children: React.ReactNode}) => children,
    Input: ({
      label,
      maxLength,
      onChangeText,
      placeholder,
      testID,
      value,
    }: {
      label: string
      maxLength: number
      onChangeText: (text: string) => void
      placeholder: string
      testID: string
      value: string
    }) => {
      const mountedWith = hooks.useRef(value)
      hooks.useEffect(() => {
        const initial = mountedWith.current
        mockInputLifecycle('mount', initial)
        return () => mockInputLifecycle('unmount', initial)
      }, [])
      return (
        <TextInput
          maxLength={maxLength}
          accessibilityLabel={label}
          accessibilityHint=""
          onChangeText={onChangeText}
          placeholder={placeholder}
          testID={testID}
          value={value}
        />
      )
    },
  }
})

const mockMetric = jest.fn()
jest.mock('#/analytics', () => ({
  useAnalytics: () => ({metric: mockMetric}),
}))

const mockPromptOpen = jest.fn()
jest.mock('#/components/Prompt', () => {
  const {Pressable, Text} = require('react-native')
  return {
    usePromptControl: () => ({open: mockPromptOpen}),
    Basic: ({title, onConfirm}: {title: string; onConfirm: () => void}) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint=""
        testID="confirmRemove"
        onPress={onConfirm}>
        <Text>{title}</Text>
      </Pressable>
    ),
  }
})
jest.mock('#/state/preferences/enable-square-buttons', () => ({
  useEnableSquareButtons: () => false,
}))

jest.mock('#/state/gallery', () => ({createInitialImages: jest.fn()}))
jest.mock('#/state/queries/threadgate', () => ({
  threadgateRecordToAllowUISetting: jest.fn(() => []),
}))
jest.mock('#/view/com/composer/state/video', () => ({
  createVideoState: jest.fn(),
  videoReducer: jest.fn(),
}))

import {PollEditor} from '../PollEditor'

/** Fills choices in order, the way typing does, so spare slots appear too. */
function composerWith(options: string[]): ComposerState {
  let state = createComposerState({
    initText: undefined,
    initMention: undefined,
    initImageUris: undefined,
    initQuoteUri: undefined,
    initInteractionSettings: undefined,
  })
  const postId = state.thread.posts[0].id
  const actions: PostAction[] = [
    {type: 'embed_add_poll'},
    ...options.map((text, index) => ({
      type: 'embed_update_poll_option' as const,
      index,
      text,
    })),
  ]
  for (const postAction of actions) {
    state = composerReducer(state, {type: 'update_post', postId, postAction})
  }
  return state
}

const mockDispatch = jest.fn()

function ComposerHarness({options}: {options: string[]}) {
  const [state, dispatch] = useReducer(composerReducer, options, composerWith)
  const post = state.thread.posts[0]
  if (!post.embed.poll) return null
  return (
    <PollEditor
      poll={post.embed.poll}
      dispatch={postAction => {
        mockDispatch(postAction)
        dispatch({type: 'update_post', postId: post.id, postAction})
      }}
    />
  )
}

function renderEditor(options: string[]) {
  return render(<ComposerHarness options={options} />)
}

function lifecycle(kind: 'mount' | 'unmount') {
  return (mockInputLifecycle.mock.calls as [string, string][])
    .filter(([event]) => event === kind)
    .map(([, value]) => value)
}

describe('PollEditor', () => {
  let consoleError: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  it('reports an edit with the index of the choice', () => {
    const {getByTestId} = renderEditor(['one', 'two'])

    expect(getByTestId('pollOptionInput-1')).toHaveProp(
      'accessibilityLabel',
      'Choice 2',
    )
    fireEvent.changeText(getByTestId('pollOptionInput-1'), 'changed')

    expect(mockDispatch).toHaveBeenCalledTimes(1)
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'embed_update_poll_option',
      index: 1,
      text: 'changed',
    })
    expect(getByTestId('pollOptionInput-0')).toHaveProp('value', 'one')
    expect(getByTestId('pollOptionInput-1')).toHaveProp('value', 'changed')
  })

  it('stops each choice at the length TOKIMEKI accepts', () => {
    const {getByTestId} = renderEditor(['one', 'two'])
    expect(getByTestId('pollOptionInput-0')).toHaveProp('maxLength', 1000)
    expect(getByTestId('pollOptionInput-1')).toHaveProp('maxLength', 1000)
  })

  it('has no add or remove buttons for choices', () => {
    const {queryByTestId} = renderEditor(['one', 'two', 'three'])
    expect(queryByTestId('addPollOptionBtn')).toBeNull()
    expect(queryByTestId('pollOptionRemove-0')).toBeNull()
  })

  it('offers another choice only once both choices have text', () => {
    const {getByTestId, queryByTestId} = renderEditor(['', ''])
    expect(queryByTestId('pollOptionInput-2')).toBeNull()

    fireEvent.changeText(getByTestId('pollOptionInput-0'), 'one')
    expect(queryByTestId('pollOptionInput-2')).toBeNull()

    fireEvent.changeText(getByTestId('pollOptionInput-1'), 'two')
    expect(getByTestId('pollOptionInput-2')).toHaveProp('value', '')
    expect(getByTestId('pollOptionInput-2')).toHaveProp(
      'placeholder',
      'Choice (optional)',
    )
  })

  it('reports a choice added by typing into the extra slot', () => {
    const {getByTestId} = renderEditor(['one', 'two'])

    fireEvent.changeText(getByTestId('pollOptionInput-2'), 't')

    expect(mockMetric).toHaveBeenCalledTimes(1)
    expect(mockMetric).toHaveBeenCalledWith('composer:poll:optionAdd', {
      count: 3,
    })
  })

  it('stops offering choices at four', () => {
    const {getByTestId, queryByTestId} = renderEditor(['a', 'b', 'c', 'd'])
    expect(getByTestId('pollOptionInput-3')).toBeTruthy()
    expect(queryByTestId('pollOptionInput-4')).toBeNull()
  })

  it('keeps the field when the last choice is cleared', () => {
    const {getByTestId, queryByTestId} = renderEditor(['a', 'b', 'c'])
    expect(getByTestId('pollOptionInput-3')).toHaveProp('value', '')

    fireEvent.changeText(getByTestId('pollOptionInput-2'), '')

    expect(getByTestId('pollOptionInput-2')).toHaveProp('value', '')
    expect(queryByTestId('pollOptionInput-3')).toBeNull()
    expect(lifecycle('unmount')).toEqual([''])
  })

  it('adds the extra slot without remounting the other choices', () => {
    const {getByTestId} = renderEditor(['A', ''])
    expect(lifecycle('mount')).toEqual(['A', ''])

    fireEvent.changeText(getByTestId('pollOptionInput-1'), 'B')

    expect(lifecycle('mount')).toEqual(['A', '', ''])
    expect(lifecycle('unmount')).toEqual([])
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('removes an untouched poll without asking', () => {
    const {getByTestId, queryByTestId} = renderEditor(['', ''])

    fireEvent.press(getByTestId('removePollBtn'))

    expect(mockPromptOpen).not.toHaveBeenCalled()
    expect(mockMetric).toHaveBeenCalledWith('composer:poll:remove', {})
    expect(mockDispatch).toHaveBeenCalledWith({type: 'embed_remove_poll'})
    expect(queryByTestId('pollEditor')).toBeNull()
  })

  it('asks before removing a poll that has choices written', () => {
    const {getByTestId, queryByTestId} = renderEditor(['one', ''])

    fireEvent.press(getByTestId('removePollBtn'))

    expect(mockPromptOpen).toHaveBeenCalledTimes(1)
    expect(mockDispatch).not.toHaveBeenCalled()

    fireEvent.press(getByTestId('confirmRemove'))

    expect(mockMetric).toHaveBeenCalledWith('composer:poll:remove', {})
    expect(mockDispatch).toHaveBeenCalledWith({type: 'embed_remove_poll'})
    expect(queryByTestId('pollEditor')).toBeNull()
  })

  it('lets the author pick a custom closing time, and go back to a preset', () => {
    const {getByTestId, queryByTestId} = renderEditor(['one', 'two'])
    expect(queryByTestId('pollEndField')).toBeNull()

    fireEvent.press(getByTestId('pollDuration-custom'))

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'embed_set_poll_end',
      endsAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
    })
    // Starts a day out (the preset), so there is nothing to warn about.
    expect(getByTestId('pollEndField')).toBeTruthy()
    expect(queryByTestId('pollEndHint')).toBeNull()
    expect(getByTestId('pollDurationBtn').props.accessibilityLabel).toBe(
      'Poll closes at a set time, change',
    )

    fireEvent.press(getByTestId('pollDuration-6h'))
    expect(queryByTestId('pollEndField')).toBeNull()
  })

  it('shows the closing time on a single dropdown', () => {
    const {getByTestId} = renderEditor(['one', 'two'])
    expect(getByTestId('pollDurationBtn').props.accessibilityLabel).toBe(
      'Poll closes after 1 day, change',
    )
  })

  it('reports the chosen closing time', () => {
    const {getByTestId} = renderEditor(['one', 'two'])

    fireEvent.press(getByTestId('pollDuration-7d'))

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'embed_set_poll_duration',
      duration: '7d',
    })
  })

  it('points out a choice that is too long', () => {
    const {getByTestId} = renderEditor(['a'.repeat(101), 'fine'])
    expect(getByTestId('pollOptionHint-0')).toHaveTextContent(
      'Choices can be up to 100 characters',
      {exact: true},
    )
  })

  it('points out a choice that cannot be saved', () => {
    const {getByTestId, queryByTestId} = renderEditor(['a\u0000b', 'fine'])
    expect(getByTestId('pollOptionHint-0')).toHaveTextContent(
      'This choice contains characters that cannot be saved',
      {exact: true},
    )
    expect(queryByTestId('pollOptionHint-1')).toBeNull()
  })

  it('says who runs voting, and nothing about the question', () => {
    const {getByText, queryByText} = renderEditor(['one', 'two'])
    expect(
      getByText('Votes are public and handled by TOKIMEKI Poll', {exact: true}),
    ).toBeTruthy()
    expect(queryByText(/question/)).toBeNull()
  })
})
