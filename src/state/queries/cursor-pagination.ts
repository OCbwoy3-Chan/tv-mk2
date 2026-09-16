import {useMemo} from 'react'
import {hashKey, type QueryKey} from '@tanstack/react-query'

/** Pagination metadata wraps the server cursor only in manual mode. */
export type CursorPageParam<Cursor> =
  Cursor | {pagination: {page: number; cursor: Cursor}}

export function pageNumber(param: unknown): number {
  return isPageParam(param) ? param.pagination.page : 1
}

function isPageParam(
  param: unknown,
): param is {pagination: {page: number; cursor: unknown}} {
  return !!param && typeof param === 'object' && 'pagination' in param
}

export function unwrapCursor<Cursor>(param: CursorPageParam<Cursor>): Cursor {
  return isPageParam(param) ? param.pagination.cursor : param
}

/** Stores lightweight cursors for revisiting pages, never the result pages. */
export function createCursorPagination<Page, Cursor>(
  enabled: boolean,
  getCursor: (page: Page) => Cursor | undefined,
  initialCursor: Cursor,
) {
  const cursors = new Map<number, Cursor>([[1, initialCursor]])
  return {
    initialPageParam: (enabled
      ? {pagination: {page: 1, cursor: initialCursor}}
      : initialCursor) as CursorPageParam<Cursor>,
    ...(enabled ? {maxPages: 1, gcTime: 0} : {}),
    getNextPageParam(
      lastPage: Page,
      _pages: Page[],
      param: CursorPageParam<Cursor>,
    ) {
      const cursor = getCursor(lastPage)
      if (cursor === undefined || cursor === '') return undefined
      if (!enabled) return cursor
      const page = pageNumber(param)
      cursors.set(page, unwrapCursor(param))
      cursors.set(page + 1, cursor)
      return {pagination: {page: page + 1, cursor}}
    },
    getPreviousPageParam(
      _page: Page,
      _pages: Page[],
      param: CursorPageParam<Cursor>,
    ) {
      const previous = pageNumber(param) - 1
      if (!enabled || previous < 1 || !cursors.has(previous)) return undefined
      return {pagination: {page: previous, cursor: cursors.get(previous)!}}
    },
  }
}

export function useCursorPagination<Page, Cursor>(
  key: QueryKey,
  enabled: boolean,
  getCursor: (page: Page) => Cursor | undefined,
  initialCursor: Cursor,
) {
  const queryKey = enabled ? [...key, 'paginated'] : key
  const identity = hashKey(queryKey)
  const options = useMemo(
    () => createCursorPagination(enabled, getCursor, initialCursor),
    // Cursor history must survive renders, but never cross query identities.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [identity],
  )
  return {...options, queryKey}
}
