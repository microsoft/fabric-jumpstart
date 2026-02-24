export const state = {
  menu: 'menu',
  menuItems: 'menuItems',
  menuData: 'menuData',
  activePath: 'activePath',
  isMenuOpen: 'isMenuOpen',
  jumpToSectionList: 'jumpToSectionList',
  dropsFilter: 'dropsFilter',
  dropsShortingType: 'dropsShortingType',
  isDropFilterOpen: 'isDropFilterOpen',
  dropsViewAndDownloadData: 'dropsViewAndDownloadData',
};

export const initialState = {
  [state.menu]: [],
  [state.menuItems]: [],
  [state.menuData]: {},
  [state.activePath]: '',
  [state.isMenuOpen]: true,
  [state.jumpToSectionList]: [],
  [state.dropsFilter]: {},
  [state.dropsShortingType]: 'newest',
  [state.isDropFilterOpen]: true,
  [state.dropsViewAndDownloadData]: {},
};
