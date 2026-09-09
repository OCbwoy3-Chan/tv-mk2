import {createSinglePathSVG} from '../TEMPLATE'

// SkyTrace's favicon mark, without its background tile.
// https://tangled.org/aly.codes/skytrace/raw/main/public/favicon.svg
export const SkyTraceIcon = createSinglePathSVG({
  path: 'M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242 M16 14v6 M8 14v6 M12 16v6',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
})
