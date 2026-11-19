/**
 * Width for the Gifts, Posts and Creators filter panels (popovers opened from the page toolbar).
 * They open from the Filter button towards the content (align="start") and are never wider than the
 * content area — the viewport less the 240px sidebar (DashboardLayout, shown from md) and margins — so
 * when Radix shifts a panel back on screen it cannot slide over the sidebar. The panel is a size
 * container, so its field grids use @container queries to drop columns when it is narrow.
 */
export const FILTER_PANEL_CLASS =
  'w-[min(640px,calc(100vw-2rem))] p-4 [container-type:inline-size] md:w-[min(640px,calc(100vw-15rem-3rem))]';
