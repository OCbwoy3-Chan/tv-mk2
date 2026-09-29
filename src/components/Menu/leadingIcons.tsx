import {cloneElement, isValidElement} from 'react'
import flattenReactChildren from 'react-keyed-flatten-children'

import {type ItemIconProps} from '#/components/Menu/types'

/** Keep action icons before labels regardless of the caller's child order. */
export function leadingIcons(
  children: React.ReactNode,
  iconComponent: React.ComponentType<ItemIconProps>,
) {
  const icons: React.ReactNode[] = []
  const content: React.ReactNode[] = []
  for (const child of flattenReactChildren(children)) {
    if (isValidElement<ItemIconProps>(child) && child.type === iconComponent) {
      icons.push(cloneElement(child, {position: 'left'}))
    } else {
      content.push(child)
    }
  }
  return [...icons, ...content]
}
