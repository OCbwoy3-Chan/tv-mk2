/** @jest-environment jsdom */

import {
  clickPostAction,
  getInitialVisiblePost,
  getNavigablePosts,
  setPostSelected,
} from './postNavigation.web'

function createPost({
  top,
  left = 0,
}: {
  top: number
  left?: number
}): HTMLElement {
  const element = document.createElement('div')
  element.dataset.keyboardNavigationPost = `post-${top}`
  element.getBoundingClientRect = () => ({
    top,
    bottom: top + 100,
    left,
    right: left + 500,
    width: 500,
    height: 100,
    x: left,
    y: top,
    toJSON() {},
  })
  document.body.appendChild(element)
  return element
}

describe('post keyboard navigation', () => {
  beforeEach(() => {
    document.body.replaceChildren()
  })

  it('returns rendered posts in visual order', () => {
    const second = createPost({top: 200})
    const first = createPost({top: 20})
    createPost({top: 0, left: window.innerWidth + 100})

    expect(getNavigablePosts()).toEqual([first, second])
  })

  it('finds the first post visible in the viewport', () => {
    createPost({top: -200})
    const firstVisible = createPost({top: -50})
    createPost({top: 100})

    expect(getInitialVisiblePost(getNavigablePosts())).toBe(firstVisible)
  })

  it('marks selection and invokes a post control', () => {
    const post = createPost({top: 20})
    const like = document.createElement('button')
    const onLike = jest.fn()
    like.dataset.testid = 'likeBtn'
    like.addEventListener('click', onLike)
    post.appendChild(like)

    setPostSelected(post, true)
    expect(post.dataset.keyboardNavigationSelected).toBe('true')
    expect(clickPostAction(post, 'like')).toBe(true)
    expect(onLike).toHaveBeenCalledTimes(1)

    setPostSelected(post, false)
    expect(post.dataset.keyboardNavigationSelected).toBeUndefined()
  })
})

it('opens image media using the existing embed control', () => {
  const post = createPost({top: 20})
  const embed = document.createElement('div')
  embed.className = 'wsky-post__media'
  const button = document.createElement('button')
  button.setAttribute('role', 'button')
  const open = jest.fn()
  button.addEventListener('click', open)
  embed.appendChild(button)
  post.appendChild(embed)
  expect(clickPostAction(post, 'media')).toBe(true)
  expect(open).toHaveBeenCalledTimes(1)
})

it('does not perform an interaction when its dropdown is unavailable', () => {
  const post = createPost({top: 20})
  const button = document.createElement('button')
  button.dataset.testid = 'likeBtn'
  const like = jest.fn()
  button.addEventListener('click', like)
  post.appendChild(button)

  expect(clickPostAction(post, 'like', true)).toBe(false)
  expect(like).not.toHaveBeenCalled()
})

it('requests the account dropdown with a shifted click', () => {
  const post = createPost({top: 20})
  const button = document.createElement('button')
  button.dataset.testid = 'postBookmarkBtn'
  button.dataset.keyboardDropdown = 'true'
  const open = jest.fn()
  button.addEventListener('click', event => open(event.shiftKey))
  post.appendChild(button)

  expect(clickPostAction(post, 'save', true)).toBe(true)
  expect(open).toHaveBeenCalledWith(true)
})

it.each(['repost', 'quote'] as const)(
  'opens the %s menu without invoking an action when shifted',
  action => {
    jest.useFakeTimers()
    const post = createPost({top: 20})
    const button = document.createElement('button')
    button.dataset.testid = 'repostBtn'
    const item = document.createElement('button')
    item.dataset.testid = 'repostDropdownRepostBtn'
    const repost = jest.fn()
    item.addEventListener('click', repost)
    button.addEventListener('click', () => document.body.appendChild(item))
    post.appendChild(button)

    expect(clickPostAction(post, action, true)).toBe(true)
    jest.runAllTimers()
    expect(item.isConnected).toBe(true)
    expect(repost).not.toHaveBeenCalled()
    jest.useRealTimers()
  },
)

it('quotes through the quote menu item', () => {
  jest.useFakeTimers()
  const post = createPost({top: 20})
  const button = document.createElement('button')
  button.dataset.testid = 'repostBtn'
  const item = document.createElement('button')
  item.dataset.testid = 'repostDropdownQuoteBtn'
  const quote = jest.fn()
  item.addEventListener('click', quote)
  button.addEventListener('click', () => document.body.appendChild(item))
  post.appendChild(button)

  expect(clickPostAction(post, 'quote')).toBe(true)
  jest.runAllTimers()
  expect(quote).toHaveBeenCalledTimes(1)
  jest.useRealTimers()
})
