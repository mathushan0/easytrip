import { useUiStore } from '@stores/uiStore';

/** Returns whether the tab bar should be visible */
export const useTabBarVisible = () => useUiStore((s) => s.tabBarVisible);
