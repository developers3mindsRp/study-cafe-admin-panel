/**
 * Sidebar menu — single source of truth for the left nav and header search.
 *
 * To add a page: append to `mainNavItemsConfig` or `othersNavItemsConfig` below.
 * Sidebar + search update automatically (via NavMenuContext); nothing else to wire up.
 */

export type NavSubItemConfig = {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
  requiredPermission?: string[];
};

export type NavItemConfig = {
  name: string;
  iconKey?: string;
  path?: string;
  subItems?: NavSubItemConfig[];
  requiredPermission?: string[];
};

export type NavSearchResult = {
  label: string;
  path: string;
  parentName?: string;
};

export const mainNavItemsConfig: NavItemConfig[] = [
  {
    iconKey: "grid",
    name: "Dashboard",
    path: "/",
    requiredPermission: ["admin:access"],
  },
  {
    iconKey: "file",
    name: "Articles",
    subItems: [
      { name: "List", path: "/articles", requiredPermission: ["articles:list", "articles:view"] },
      { name: "Create", path: "/articles/create", requiredPermission: ["articles:create"] },
      { name: "Blog Categories", path: "/article-categories", requiredPermission: ["articles:list", "articles:view"] },
    ],
    requiredPermission: ["articles:list", "articles:view", "articles:create", "articles:edit", "articles:delete"],
  },
  {
    iconKey: "folder",
    name: "Courses",
    subItems: [
      { name: "List", path: "/courses", requiredPermission: ["courses:list", "courses:view"] },
      { name: "Create", path: "/courses/create", requiredPermission: ["courses:create"] },
      { name: "Categories", path: "/courses/categories", requiredPermission: ["course_categories:list", "course_categories:view"] },
      { name: "Common Sections", path: "/courses/settings", requiredPermission: ["courses:edit"] },
      { name: "Reviews", path: "/courses/reviews", requiredPermission: ["course_reviews:list", "course_reviews:view"] },
      { name: "Marketing Pages", path: "/marketing-pages", requiredPermission: ["marketing_pages:list", "marketing_pages:view"] },
    ],
    requiredPermission: [
      "courses:list",
      "courses:view",
      "courses:create",
      "courses:edit",
      "courses:delete",
      "marketing_pages:list",
      "marketing_pages:view",
      "marketing_pages:create",
      "marketing_pages:edit",
      "marketing_pages:delete",
      "course_categories:list",
      "course_categories:view",
      "course_reviews:list",
      "course_reviews:view",
    ],
  },
  {
    iconKey: "video",
    name: "Live Sessions",
    path: "/live-sessions",
    requiredPermission: ["live_sessions:list", "live_sessions:view"],
  },
  {
    iconKey: "dollar",
    name: "Orders",
    subItems: [{ name: "List", path: "/orders", requiredPermission: ["orders:list", "orders:view"] }],
    requiredPermission: ["orders:list", "orders:view"],
  },
  {
    iconKey: "dollar",
    name: "Coupons",
    subItems: [
      { name: "List", path: "/coupons", requiredPermission: ["coupons:list", "coupons:view"] },
      { name: "Create", path: "/coupons/create", requiredPermission: ["coupons:create"] },
      { name: "Usage Report", path: "/coupons/usage", requiredPermission: ["coupons:list", "coupons:view"] },
    ],
    requiredPermission: ["coupons:list", "coupons:view", "coupons:create", "coupons:edit", "coupons:delete"],
  },
  {
    iconKey: "dollar",
    name: "Payment Links",
    subItems: [
      { name: "All Links", path: "/payment-links", requiredPermission: ["payment_links:list", "payment_links:view"] },
      { name: "Create", path: "/payment-links/create", requiredPermission: ["payment_links:create"] },
    ],
    requiredPermission: [
      "payment_links:list",
      "payment_links:view",
      "payment_links:create",
      "payment_links:edit",
      "payment_links:delete",
    ],
  },
  {
    iconKey: "group",
    name: "Memberships",
    subItems: [
      { name: "List", path: "/memberships", requiredPermission: ["memberships:list", "memberships:view"] },
      { name: "Create", path: "/memberships/create", requiredPermission: ["memberships:create"] },
      { name: "Comparison Features", path: "/memberships/comparison-features", requiredPermission: ["memberships:edit"] },
    ],
    requiredPermission: ["memberships:list", "memberships:view", "memberships:create", "memberships:edit", "memberships:delete"],
  },
  {
    iconKey: "docs",
    name: "Media",
    path: "/media",
    requiredPermission: ["media:list", "media:view", "media:edit"],
  },
  {
    iconKey: "page",
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
      { name: "Footer", path: "/content/footer", requiredPermission: ["content:list", "content:view", "content:edit"] },
      { name: "Popup Banners", path: "/banners", requiredPermission: ["banners:list"] },
    ],
    requiredPermission: ["content:list", "content:view", "content:edit"],
  },
  {
    iconKey: "chat",
    name: "Google Reviews",
    subItems: [
      { name: "List", path: "/google-reviews", requiredPermission: ["google_reviews:list", "google_reviews:view"] },
      { name: "Create", path: "/google-reviews/create", requiredPermission: ["google_reviews:create"] },
    ],
    requiredPermission: [
      "google_reviews:list",
      "google_reviews:view",
      "google_reviews:create",
      "google_reviews:edit",
      "google_reviews:delete",
    ],
  },
  {
    iconKey: "video",
    name: "Testimonials",
    subItems: [
      { name: "List", path: "/testimonials", requiredPermission: ["testimonials:list", "testimonials:view"] },
      { name: "Create", path: "/testimonials/create", requiredPermission: ["testimonials:create"] },
    ],
    requiredPermission: [
      "testimonials:list",
      "testimonials:view",
      "testimonials:create",
      "testimonials:edit",
      "testimonials:delete",
    ],
  },
  {
    iconKey: "info",
    name: "FAQ",
    subItems: [
      { name: "List", path: "/faq", requiredPermission: ["faq:list", "faq:view"] },
      { name: "Create", path: "/faq/create", requiredPermission: ["faq:create"] },
    ],
    requiredPermission: ["faq:list", "faq:view", "faq:create", "faq:edit", "faq:delete"],
  },
  {
    iconKey: "mail",
    name: "Contact Inquiries",
    subItems: [{ name: "List", path: "/contact-inquiries", requiredPermission: ["contact_inquiries:list", "contact_inquiries:view"] }],
    requiredPermission: ["contact_inquiries:list", "contact_inquiries:view"],
  },
  {
    iconKey: "mail",
    name: "Newsletter",
    subItems: [
      { name: "Subscribers", path: "/newsletter/subscribers", requiredPermission: ["newsletter:list"] },
      { name: "Templates", path: "/newsletter/templates", requiredPermission: ["newsletter:list"] },
      { name: "Send", path: "/newsletter/send", requiredPermission: ["newsletter:send"] },
    ],
    requiredPermission: ["newsletter:list", "newsletter:create", "newsletter:edit", "newsletter:delete", "newsletter:send"],
  },
  {
    iconKey: "docs",
    name: "SEO Metadata",
    subItems: [
      { name: "List", path: "/seo-metadata", requiredPermission: ["seo:list", "seo:view"] },
      { name: "Site pages (URLs)", path: "/seo-metadata/site-pages", requiredPermission: ["seo:list", "seo:view"] },
      { name: "Create", path: "/seo-metadata/create", requiredPermission: ["seo:create"] },
    ],
    requiredPermission: ["seo:list", "seo:view", "seo:create", "seo:edit", "seo:delete"],
  },
  {
    iconKey: "user",
    name: "Admin Users",
    subItems: [
      { name: "List", path: "/admin-users", requiredPermission: ["admin_users:list", "admin_users:view"] },
      { name: "Create", path: "/admin-users/create", requiredPermission: ["admin_users:create"] },
      { name: "Roles", path: "/roles", requiredPermission: ["roles:list", "roles:view"] },
    ],
    requiredPermission: ["admin_users:list", "admin_users:view", "admin_users:create", "admin_users:edit", "admin_users:delete", "roles:list", "roles:view"],
  },
  {
    iconKey: "user",
    name: "Users (Students)",
    subItems: [
      { name: "List", path: "/users", requiredPermission: ["admin_users:list"] },
      { name: "Create", path: "/users/create", requiredPermission: ["admin_users:create"] },
    ],
    requiredPermission: ["admin_users:list"],
  },
  {
    iconKey: "dollar",
    name: "Affiliate",
    subItems: [
      { name: "Affiliate History", path: "/affiliate/history", requiredPermission: ["affiliate:list", "affiliate:view"] },
      { name: "Withdrawal Requests", path: "/affiliate/withdrawals", requiredPermission: ["affiliate:list", "affiliate:view"] },
    ],
    requiredPermission: ["affiliate:list", "affiliate:view"],
  },
  {
    iconKey: "folder",
    name: "Downloads",
    subItems: [
      { name: "Files", path: "/downloads/files", requiredPermission: ["downloads:list", "downloads:view"] },
      { name: "Categories", path: "/downloads/categories", requiredPermission: ["downloads:list", "downloads:view"] },
    ],
    requiredPermission: ["downloads:list", "downloads:view", "downloads:create", "downloads:edit", "downloads:delete"],
  },
  {
    iconKey: "bolt",
    name: "Global Settings",
    subItems: [
      {
        name: "Marketing & analytics",
        path: "/settings/global",
        requiredPermission: ["global_settings:list", "global_settings:view", "global_settings:edit"],
      },
      {
        name: "Payment Gateway",
        path: "/settings/global/payment-gateway",
        requiredPermission: ["global_settings:list", "global_settings:view", "global_settings:edit"],
      },
      {
        name: "Display Ads",
        path: "/settings/global/display-ads",
        requiredPermission: [
          "global_settings:list",
          "global_settings:view",
          "global_settings:edit",
          "content:list",
          "content:view",
          "content:edit",
        ],
      },
    ],
    requiredPermission: [
      "global_settings:list",
      "global_settings:view",
      "global_settings:edit",
      "content:list",
      "content:view",
      "content:edit",
    ],
  },
];

export const othersNavItemsConfig: NavItemConfig[] = [];

function canSee(
  requiredPermission: string[] | undefined,
  hasAnyPermission: (perms: string[]) => boolean,
): boolean {
  return !requiredPermission?.length || hasAnyPermission(requiredPermission);
}

export function filterNavItems(
  items: NavItemConfig[],
  hasAnyPermission: (perms: string[]) => boolean,
): NavItemConfig[] {
  return items.filter((item) => canSee(item.requiredPermission, hasAnyPermission));
}

export function buildNavSearchIndex(
  items: NavItemConfig[],
  hasAnyPermission: (perms: string[]) => boolean,
): Array<NavSearchResult & { searchText: string }> {
  const out: Array<NavSearchResult & { searchText: string }> = [];

  for (const item of items) {
    if (!canSee(item.requiredPermission, hasAnyPermission)) continue;

    if (item.path) {
      const searchText = item.name.toLowerCase();
      out.push({ label: item.name, path: item.path, searchText });
    }

    if (item.subItems) {
      for (const sub of item.subItems) {
        if (!canSee(sub.requiredPermission, hasAnyPermission)) continue;
        const searchText = `${item.name} ${sub.name}`.toLowerCase();
        out.push({
          label: sub.name,
          parentName: item.name,
          path: sub.path,
          searchText,
        });
      }
    }
  }

  return out;
}

export function searchNavItems(
  index: Array<NavSearchResult & { searchText: string }>,
  query: string,
  limit = 12,
): NavSearchResult[] {
  const q = query.trim().toLowerCase();
  const list = q
    ? index.filter((row) => row.searchText.includes(q))
    : index;

  return list.slice(0, limit).map(({ label, path, parentName }) => ({
    label,
    path,
    parentName,
  }));
}
