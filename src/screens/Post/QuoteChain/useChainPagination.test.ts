import {act, renderHook} from '@testing-library/react-native'

import {useChainPagination} from '#/screens/Post/QuoteChain/useChainPagination'

function setup() {
  const props = {
    lastUri: 'first',
    hasNextPage: true,
    isFetching: false,
    isError: false,
    fetchNextPage: jest.fn().mockResolvedValue(undefined),
  }
  return {props, ...renderHook(useChainPagination, {initialProps: props})}
}

it('continues a short chain without another end-reached event', () => {
  const {props, result, rerender} = setup()
  act(() => result.current.onEndReached())
  expect(props.fetchNextPage).toHaveBeenCalledTimes(1)

  rerender({...props, lastUri: 'second'})
  act(() => result.current.onItemNearViewport({uri: 'second'}))
  expect(props.fetchNextPage).toHaveBeenCalledTimes(2)

  rerender({...props, lastUri: 'third'})
  act(() => result.current.onItemNearViewport({uri: 'third'}))
  expect(props.fetchNextPage).toHaveBeenCalledTimes(3)
})

it('retains demand while a fetch is finishing', () => {
  const {props, result, rerender} = setup()
  rerender({...props, isFetching: true})
  act(() => result.current.onItemNearViewport({uri: 'first'}))
  expect(props.fetchNextPage).not.toHaveBeenCalled()
  rerender(props)
  expect(props.fetchNextPage).toHaveBeenCalledTimes(1)
})

it('waits for the new last post and ignores earlier visible rows', () => {
  const {props, result, rerender} = setup()
  act(() => result.current.onItemNearViewport({uri: 'first'}))
  rerender({...props, lastUri: 'second'})
  act(() => result.current.onItemNearViewport({uri: 'first'}))
  expect(props.fetchNextPage).toHaveBeenCalledTimes(1)
})

it.each([{hasNextPage: false}, {isError: true}])(
  'does not automatically fetch when stopped: %s',
  stopped => {
    const {props, result, rerender} = setup()
    rerender({...props, ...stopped})
    act(() => result.current.onEndReached())
    act(() => result.current.onItemNearViewport({uri: 'first'}))
    expect(props.fetchNextPage).not.toHaveBeenCalled()
  },
)
