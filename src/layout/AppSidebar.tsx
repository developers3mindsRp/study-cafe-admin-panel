import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

import { useMemo } from "react";
import { ChatIcon, ChevronDownIcon, DocsIcon, DollarLineIcon, FileIcon, FolderIcon, GridIcon, GroupIcon, HorizontaLDots, InfoIcon, MailIcon, PageIcon, UserIcon, VideoIcon } from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";

type SubItem = {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
  /** If set, this sub-item is only shown when user has at least one of these permissions */
  requiredPermission?: string[];
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubItem[];
  /** If set, this item is only shown when user has at least one of these permissions */
  requiredPermission?: string[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
    requiredPermission: ["admin:access"],
  },
  {
    icon: <FileIcon />,
    name: "Articles",
    subItems: [
      { name: "List", path: "/articles", requiredPermission: ["articles:list", "articles:view"] },
      { name: "Create", path: "/articles/create", requiredPermission: ["articles:create"] },
      { name: "Blog Categories", path: "/article-categories", requiredPermission: ["articles:list", "articles:view"] },
    ],
    requiredPermission: ["articles:list", "articles:view", "articles:create", "articles:edit", "articles:delete"],
  },
  {
    icon: <FolderIcon />,
    name: "Courses",
    subItems: [
      { name: "List", path: "/courses", requiredPermission: ["courses:list", "courses:view"] },
      { name: "Create", path: "/courses/create", requiredPermission: ["courses:create"] },
      { name: "Categories", path: "/courses/categories", requiredPermission: ["courses:list", "courses:view"] },
      { name: "Page Settings", path: "/courses/settings", requiredPermission: ["courses:edit"] },
    ],
    requiredPermission: ["courses:list", "courses:view", "courses:create", "courses:edit", "courses:delete"],
  },
  {
    icon: <VideoIcon />,
    name: "Live Sessions",
    path: "/live-sessions",
    requiredPermission: ["live_sessions:list", "live_sessions:view"],
  },
  {
    icon: <DollarLineIcon />,
    name: "Orders",
    subItems: [
      { name: "List", path: "/orders", requiredPermission: ["orders:list", "orders:view"] },
    ],
    requiredPermission: ["orders:list", "orders:view"],
  },
  {
    icon: <DollarLineIcon />,
    name: "Coupons",
    subItems: [
      { name: "List", path: "/coupons", requiredPermission: ["coupons:list", "coupons:view"] },
      { name: "Create", path: "/coupons/create", requiredPermission: ["coupons:create"] },
    ],
    requiredPermission: ["coupons:list", "coupons:view", "coupons:create", "coupons:edit", "coupons:delete"],
  },
  {
    icon: <GroupIcon />,
    name: "Memberships",
    subItems: [
      { name: "List", path: "/memberships", requiredPermission: ["memberships:list", "memberships:view"] },
      { name: "Create", path: "/memberships/create", requiredPermission: ["memberships:create"] },
      { name: "Comparison Features", path: "/memberships/comparison-features", requiredPermission: ["memberships:edit"] },
    ],
    requiredPermission: ["memberships:list", "memberships:view", "memberships:create", "memberships:edit", "memberships:delete"],
  },
  {
    icon: <PageIcon />,
    name: "Page Content",
    subItems: [
      { name: "Home", path: "/content/home", requiredPermission: ["content:list", "content:view", "content:edit"] },
      { name: "About", path: "/content/about", requiredPermission: ["content:list", "content:view", "content:edit"] },
      { name: "Contact", path: "/content/contact", requiredPermission: ["content:list", "content:view", "content:edit"] },
      { name: "Privacy Policy", path: "/content/privacy-policy", requiredPermission: ["content:list", "content:view", "content:edit"] },
      { name: "Ethics Policy", path: "/content/ethics-policy", requiredPermission: ["content:list", "content:view", "content:edit"] },
      { name: "Terms of Use", path: "/content/terms-of-use", requiredPermission: ["content:list", "content:view", "content:edit"] },
      { name: "Disclaimer", path: "/content/disclaimer", requiredPermission: ["content:list", "content:view", "content:edit"] },
      { name: "Refund Policy", path: "/content/refund-policy", requiredPermission: ["content:list", "content:view", "content:edit"] },
    ],
    requiredPermission: ["content:list", "content:view", "content:edit"],
  },
  {
    icon: <ChatIcon />,
    name: "Testimonials",
    subItems: [
      { name: "List", path: "/testimonials", requiredPermission: ["testimonials:list", "testimonials:view"] },
      { name: "Create", path: "/testimonials/create", requiredPermission: ["testimonials:create"] },
    ],
    requiredPermission: ["testimonials:list", "testimonials:view", "testimonials:create", "testimonials:edit", "testimonials:delete"],
  },
  {
    icon: <InfoIcon />,
    name: "FAQ",
    subItems: [
      { name: "List", path: "/faq", requiredPermission: ["faq:list", "faq:view"] },
      { name: "Create", path: "/faq/create", requiredPermission: ["faq:create"] },
    ],
    requiredPermission: ["faq:list", "faq:view", "faq:create", "faq:edit", "faq:delete"],
  },
  {
    icon: <MailIcon />,
    name: "Contact Inquiries",
    subItems: [
      { name: "List", path: "/contact-inquiries", requiredPermission: ["contact_inquiries:list", "contact_inquiries:view"] },
    ],
    requiredPermission: ["contact_inquiries:list", "contact_inquiries:view"],
  },
  {
    icon: <MailIcon />,
    name: "Newsletter",
    subItems: [
      { name: "Subscribers", path: "/newsletter/subscribers", requiredPermission: ["newsletter:list"] },
      { name: "Templates", path: "/newsletter/templates", requiredPermission: ["newsletter:list"] },
      { name: "Send", path: "/newsletter/send", requiredPermission: ["newsletter:send"] },
    ],
    requiredPermission: ["newsletter:list", "newsletter:create", "newsletter:edit", "newsletter:delete", "newsletter:send"],
  },
  {
    icon: <DocsIcon />,
    name: "SEO Metadata",
    subItems: [
      { name: "List", path: "/seo-metadata", requiredPermission: ["seo:list", "seo:view"] },
      { name: "Create", path: "/seo-metadata/create", requiredPermission: ["seo:create"] },
    ],
    requiredPermission: ["seo:list", "seo:view", "seo:create", "seo:edit", "seo:delete"],
  },
  {
    icon: <UserIcon />,
    name: "Admin Users",
    subItems: [
      { name: "List", path: "/admin-users", requiredPermission: ["admin_users:list", "admin_users:view"] },
      { name: "Create", path: "/admin-users/create", requiredPermission: ["admin_users:create"] },
    ],
    requiredPermission: ["admin_users:list", "admin_users:view", "admin_users:create", "admin_users:edit", "admin_users:delete"],
  },
  {
    icon: <UserIcon />, // Reusing UserIcon
    name: "Users (Students)",
    subItems: [
      { name: "List", path: "/users", requiredPermission: ["admin_users:list"] },
      { name: "Create", path: "/users/create", requiredPermission: ["admin_users:create"] },
    ],
    requiredPermission: ["admin_users:list"],
  },
  {
    icon: <DollarLineIcon />,
    name: "Affiliate",
    subItems: [
      { name: "Affiliate History", path: "/affiliate/history", requiredPermission: ["affiliate:list", "affiliate:view"] },
      { name: "Withdrawal Requests", path: "/affiliate/withdrawals", requiredPermission: ["affiliate:list", "affiliate:view"] },
    ],
    requiredPermission: ["affiliate:list", "affiliate:view"],
  },
  {
    icon: <FolderIcon />,
    name: "Downloads",
    subItems: [
      { name: "Files", path: "/downloads/files", requiredPermission: ["downloads:list", "downloads:view"] },
      { name: "Categories", path: "/downloads/categories", requiredPermission: ["downloads:list", "downloads:view"] },
    ],
    requiredPermission: ["downloads:list", "downloads:view", "downloads:create", "downloads:edit", "downloads:delete"],
  },
];

const othersItems: NavItem[] = [
  // {
  //   icon: <PieChartIcon />,
  //   name: "Charts",
  //   subItems: [
  //     { name: "Line Chart", path: "/line-chart", pro: false },
  //     { name: "Bar Chart", path: "/bar-chart", pro: false },
  //   ],
  // },
  // {
  //   icon: <BoxCubeIcon />,
  //   name: "UI Elements",
  //   subItems: [
  //     { name: "Alerts", path: "/alerts", pro: false },
  //     { name: "Avatar", path: "/avatars", pro: false },
  //     { name: "Badge", path: "/badge", pro: false },
  //     { name: "Buttons", path: "/buttons", pro: false },
  //     { name: "Images", path: "/images", pro: false },
  //     { name: "Videos", path: "/videos", pro: false },
  //   ],
  // },
  // {
  //   icon: <PlugInIcon />,
  //   name: "Authentication",
  //   subItems: [
  //     { name: "Sign In", path: "/signin", pro: false },
  //     { name: "Sign Up", path: "/signup", pro: false },
  //   ],
  // },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { hasAnyPermission } = useAuth();
  const mainNavItems = useMemo(
    () =>
      navItems.filter(
        (item) =>
          !item.requiredPermission || hasAnyPermission(item.requiredPermission)
      ),
    [hasAnyPermission]
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? mainNavItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive, mainNavItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={`menu-item-icon-size  ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                    ? "rotate-180 text-brand-500"
                    : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`menu-item-icon-size ${isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems
                  .filter(
                    (subItem) =>
                      !subItem.requiredPermission?.length || hasAnyPermission(subItem.requiredPermission)
                  )
                  .map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        to={subItem.path}
                        className={`menu-dropdown-item ${isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                          }`}
                      >
                        {subItem.name}
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                            >
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(mainNavItems, "main")}
            </div>
            {othersItems.length > 0 && <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
