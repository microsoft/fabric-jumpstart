import { ACTION } from './action';

function appReducer(state: any, action: any) {
  switch (action.type) {
    case ACTION.SET_MENU:
      return { ...state, menu: action.payload };
    case ACTION.SET_MENU_ITEMS:
      return { ...state, menuItems: action.payload };
    case ACTION.SET_MENU_DATA:
      return { ...state, menuData: action.payload };
    case ACTION.SET_ACTIVE_PATH:
      return { ...state, activePath: action.payload };
    case ACTION.SET_IS_MENU_OPEN:
      return { ...state, isMenuOpen: action.payload };
    case ACTION.SET_JUMP_TO_SECTION_LIST:
      return { ...state, jumpToSectionList: action.payload };
    case ACTION.SET_DROPS_FILTER:
      const { type, tag, name } = action.payload;
      if (state.dropsFilter[type]) {
        const tags = state.dropsFilter[type].tags;
        const names = state.dropsFilter[type].names;
        if (tags.includes(tag)) {
          state.dropsFilter[type].tags = tags.filter((t: string) => t !== tag);
          state.dropsFilter[type].names = names.filter(
            (t: string) => t !== name
          );
          if (state.dropsFilter[type].tags.length === 0) {
            delete state.dropsFilter[type];
          }
        } else {
          state.dropsFilter[type].tags = [...tags, tag];
          state.dropsFilter[type].names = [...names, name];
        }
      } else {
        state.dropsFilter[type] = { tags: [tag], names: [name] };
      }
      return { ...state, dropsFilter: state.dropsFilter };
    case ACTION.RESET_DROPS_FILTER:
      return { ...state, dropsFilter: {} };
    case ACTION.SET_DROPS_SHORTING_TYPE:
      return { ...state, dropsShortingType: action.payload };
    case ACTION.SET_IS_DROP_FILTER_OPEN:
      return { ...state, isDropFilterOpen: action.payload };

    case ACTION.SET_DROPS_VIEW_AND_DOWNLOAD_DATA:
      return { ...state, dropsViewAndDownloadData: action.payload };
    default:
      return state;
  }
}

export default appReducer;
