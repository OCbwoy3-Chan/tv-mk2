import {moveItem} from './post-order'

describe('moveItem', () => {
  const items = [{id: 'first'}, {id: 'second'}, {id: 'third'}]

  it('moves an item up or down without mutating the original list', () => {
    expect(moveItem(items, 'second', 'up')?.map(item => item.id)).toEqual([
      'second',
      'first',
      'third',
    ])
    expect(moveItem(items, 'second', 'down')?.map(item => item.id)).toEqual([
      'first',
      'third',
      'second',
    ])
    expect(items.map(item => item.id)).toEqual(['first', 'second', 'third'])
  })

  it('returns undefined when the item cannot move in that direction', () => {
    expect(moveItem(items, 'first', 'up')).toBeUndefined()
    expect(moveItem(items, 'third', 'down')).toBeUndefined()
    expect(moveItem(items, 'missing', 'down')).toBeUndefined()
  })
})
