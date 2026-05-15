import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import {
  buildNavSearchIndex,
  filterNavItems,
  mainNavItemsConfig,
  othersNavItemsConfig,
  searchNavItems,
  type NavSearchResult,
} from "../layout/sidebarMenu";
import { withNavIcons, type NavItemWithIcon } from "../layout/navIcons";

type NavSearchRow = NavSearchResult & { searchText: string };

type NavMenuContextValue = {
  /** Same items the sidebar renders (icons attached, permission-filtered). */
  mainNavItems: NavItemWithIcon[];
  othersNavItems: NavItemWithIcon[];
  /** Flat index for the header search — built from sidebar menu data. */
  searchIndex: NavSearchRow[];
  searchMenus: (query: string, limit?: number) => NavSearchResult[];
};

const NavMenuContext = createContext<NavMenuContextValue | null>(null);

/**
 * Builds sidebar + header search from `sidebarMenu.ts` (single menu list).
 */
export function NavMenuProvider({ children }: { children: ReactNode }) {
  const { hasAnyPermission } = useAuth();

  const value = useMemo<NavMenuContextValue>(() => {
    const mainNavItems = withNavIcons(
      filterNavItems(mainNavItemsConfig, hasAnyPermission),
    );
    const othersNavItems = withNavIcons(
      filterNavItems(othersNavItemsConfig, hasAnyPermission),
    );

    const visibleConfigs = [
      ...filterNavItems(mainNavItemsConfig, hasAnyPermission),
      ...filterNavItems(othersNavItemsConfig, hasAnyPermission),
    ];
    const searchIndex = buildNavSearchIndex(visibleConfigs, hasAnyPermission);

    return {
      mainNavItems,
      othersNavItems,
      searchIndex,
      searchMenus: (query: string, limit?: number) =>
        searchNavItems(searchIndex, query, limit),
    };
  }, [hasAnyPermission]);

  return (
    <NavMenuContext.Provider value={value}>{children}</NavMenuContext.Provider>
  );
}

export function useNavMenu(): NavMenuContextValue {
  const ctx = useContext(NavMenuContext);
  if (!ctx) {
    throw new Error("useNavMenu must be used within NavMenuProvider");
  }
  return ctx;
}
