/**
 * Permission levels per module: view < edit < create < delete.
 * Selecting a level grants that level and all lower levels (e.g. Edit grants View).
 */

export type ModuleLevel = "none" | "view" | "edit" | "create" | "delete";

export interface ModuleLevelOption {
  value: ModuleLevel;
  label: string;
  permissions: string[];
}

export interface ModuleConfig {
  key: string;
  name: string;
  levels: ModuleLevelOption[];
}

/** Permissions for each level per module. Higher level includes all lower. */
export const MODULE_LEVELS: ModuleConfig[] = [
  {
    key: "articles",
    name: "Articles",
    levels: [
      { value: "none", label: "None", permissions: [] },
      { value: "view", label: "View only", permissions: ["articles:list", "articles:view"] },
      { value: "edit", label: "Edit (includes view)", permissions: ["articles:list", "articles:view", "articles:edit"] },
      { value: "create", label: "Create (includes view, edit)", permissions: ["articles:list", "articles:view", "articles:edit", "articles:create"] },
      { value: "delete", label: "Delete / Full", permissions: ["articles:list", "articles:view", "articles:edit", "articles:create", "articles:delete"] },
    ],
  },
  {
    key: "content",
    name: "Page Content",
    levels: [
      { value: "none", label: "None", permissions: [] },
      { value: "view", label: "View only", permissions: ["content:list", "content:view"] },
      { value: "edit", label: "Edit (includes view)", permissions: ["content:list", "content:view", "content:edit"] },
    ],
  },
  {
    key: "seo",
    name: "SEO Metadata",
    levels: [
      { value: "none", label: "None", permissions: [] },
      { value: "view", label: "View only", permissions: ["seo:list", "seo:view"] },
      { value: "edit", label: "Edit (includes view)", permissions: ["seo:list", "seo:view", "seo:edit"] },
      { value: "create", label: "Create (includes view, edit)", permissions: ["seo:list", "seo:view", "seo:edit", "seo:create"] },
      { value: "delete", label: "Delete / Full", permissions: ["seo:list", "seo:view", "seo:edit", "seo:create", "seo:delete"] },
    ],
  },
  {
    key: "memberships",
    name: "Memberships",
    levels: [
      { value: "none", label: "None", permissions: [] },
      { value: "view", label: "View only", permissions: ["memberships:list", "memberships:view"] },
      { value: "edit", label: "Edit (includes view)", permissions: ["memberships:list", "memberships:view", "memberships:edit"] },
      { value: "create", label: "Create (includes view, edit)", permissions: ["memberships:list", "memberships:view", "memberships:edit", "memberships:create"] },
      { value: "delete", label: "Delete / Full", permissions: ["memberships:list", "memberships:view", "memberships:edit", "memberships:create", "memberships:delete"] },
    ],
  },
  {
    key: "google_reviews",
    name: "Google Reviews",
    levels: [
      { value: "none", label: "None", permissions: [] },
      { value: "view", label: "View only", permissions: ["google_reviews:list", "google_reviews:view"] },
      { value: "edit", label: "Edit (includes view)", permissions: ["google_reviews:list", "google_reviews:view", "google_reviews:edit"] },
      { value: "create", label: "Create (includes view, edit)", permissions: ["google_reviews:list", "google_reviews:view", "google_reviews:edit", "google_reviews:create"] },
      { value: "delete", label: "Delete / Full", permissions: ["google_reviews:list", "google_reviews:view", "google_reviews:edit", "google_reviews:create", "google_reviews:delete"] },
    ],
  },
  {
    key: "testimonials",
    name: "Testimonials",
    levels: [
      { value: "none", label: "None", permissions: [] },
      { value: "view", label: "View only", permissions: ["testimonials:list", "testimonials:view"] },
      { value: "edit", label: "Edit (includes view)", permissions: ["testimonials:list", "testimonials:view", "testimonials:edit"] },
      { value: "create", label: "Create (includes view, edit)", permissions: ["testimonials:list", "testimonials:view", "testimonials:edit", "testimonials:create"] },
      { value: "delete", label: "Delete / Full", permissions: ["testimonials:list", "testimonials:view", "testimonials:edit", "testimonials:create", "testimonials:delete"] },
    ],
  },
  {
    key: "products",
    name: "Our Products",
    levels: [
      { value: "none", label: "None", permissions: [] },
      { value: "view", label: "View only", permissions: ["products:list", "products:view"] },
      { value: "edit", label: "Edit (includes view)", permissions: ["products:list", "products:view", "products:edit"] },
      { value: "create", label: "Create (includes view, edit)", permissions: ["products:list", "products:view", "products:edit", "products:create"] },
      { value: "delete", label: "Delete / Full", permissions: ["products:list", "products:view", "products:edit", "products:create", "products:delete"] },
    ],
  },
  {
    key: "faq",
    name: "FAQ",
    levels: [
      { value: "none", label: "None", permissions: [] },
      { value: "view", label: "View only", permissions: ["faq:list", "faq:view"] },
      { value: "edit", label: "Edit (includes view)", permissions: ["faq:list", "faq:view", "faq:edit"] },
      { value: "create", label: "Create (includes view, edit)", permissions: ["faq:list", "faq:view", "faq:edit", "faq:create"] },
      { value: "delete", label: "Delete / Full", permissions: ["faq:list", "faq:view", "faq:edit", "faq:create", "faq:delete"] },
    ],
  },
  {
    key: "professions",
    name: "Professions",
    levels: [
      { value: "none", label: "None", permissions: [] },
      { value: "view", label: "View only", permissions: ["professions:list", "professions:view"] },
      { value: "edit", label: "Edit (includes view)", permissions: ["professions:list", "professions:view", "professions:edit"] },
      { value: "create", label: "Create (includes view, edit)", permissions: ["professions:list", "professions:view", "professions:edit", "professions:create"] },
      { value: "delete", label: "Delete / Full", permissions: ["professions:list", "professions:view", "professions:edit", "professions:create", "professions:delete"] },
    ],
  },
  {
    key: "admin_users",
    name: "Admin Users",
    levels: [
      { value: "none", label: "None", permissions: [] },
      { value: "view", label: "View only", permissions: ["admin_users:list", "admin_users:view"] },
      { value: "edit", label: "Edit (includes view)", permissions: ["admin_users:list", "admin_users:view", "admin_users:edit"] },
      { value: "create", label: "Create (includes view, edit)", permissions: ["admin_users:list", "admin_users:view", "admin_users:edit", "admin_users:create"] },
      { value: "delete", label: "Delete / Full", permissions: ["admin_users:list", "admin_users:view", "admin_users:edit", "admin_users:create", "admin_users:delete"] },
    ],
  },
  {
    key: "students",
    name: "Students",
    levels: [
      { value: "none", label: "None", permissions: [] },
      { value: "view", label: "View only", permissions: ["students:list", "students:view"] },
      { value: "edit", label: "Edit (includes view)", permissions: ["students:list", "students:view", "students:edit"] },
      { value: "create", label: "Create (includes view, edit)", permissions: ["students:list", "students:view", "students:edit", "students:create"] },
      { value: "delete", label: "Delete / Full", permissions: ["students:list", "students:view", "students:edit", "students:create", "students:delete"] },
    ],
  },
  {
    key: "roles",
    name: "Roles & Permissions",
    levels: [
      { value: "none", label: "None", permissions: [] },
      { value: "view", label: "View only", permissions: ["roles:list", "roles:view"] },
      { value: "edit", label: "Edit (includes view)", permissions: ["roles:list", "roles:view", "roles:edit"] },
      { value: "create", label: "Create (includes view, edit)", permissions: ["roles:list", "roles:view", "roles:edit", "roles:create"] },
      { value: "delete", label: "Delete / Full", permissions: ["roles:list", "roles:view", "roles:edit", "roles:create", "roles:delete"] },
    ],
  },
  {
    key: "newsletter",
    name: "Newsletter",
    levels: [
      { value: "none", label: "None", permissions: [] },
      { value: "view", label: "View only", permissions: ["newsletter:list"] },
      { value: "edit", label: "Edit (includes view)", permissions: ["newsletter:list", "newsletter:edit"] },
      { value: "create", label: "Create (includes view, edit)", permissions: ["newsletter:list", "newsletter:edit", "newsletter:create"] },
      { value: "delete", label: "Delete / Full", permissions: ["newsletter:list", "newsletter:edit", "newsletter:create", "newsletter:delete"] },
    ],
  },
  {
    key: "media",
    name: "Media",
    levels: [
      { value: "none", label: "None", permissions: [] },
      { value: "view", label: "View only", permissions: ["media:list", "media:view"] },
      { value: "edit", label: "Edit (includes view)", permissions: ["media:list", "media:view", "media:edit"] },
      { value: "delete", label: "Delete / Full", permissions: ["media:list", "media:view", "media:edit", "media:delete"] },
    ],
  },
  {
    key: "courses",
    name: "Courses",
    levels: [
      { value: "none", label: "None", permissions: [] },
      {
        value: "view",
        label: "View only",
        permissions: [
          "courses:list", "courses:view",
          "course_categories:list", "course_categories:view",
          "marketing_pages:list", "marketing_pages:view",
          "course_reviews:list", "course_reviews:view",
        ],
      },
      {
        value: "edit",
        label: "Edit (includes view)",
        permissions: [
          "courses:list", "courses:view", "courses:edit",
          "course_categories:list", "course_categories:view", "course_categories:edit",
          "marketing_pages:list", "marketing_pages:view", "marketing_pages:edit",
          "course_reviews:list", "course_reviews:view", "course_reviews:edit",
        ],
      },
      {
        value: "create",
        label: "Create (includes view, edit)",
        permissions: [
          "courses:list", "courses:view", "courses:edit", "courses:create",
          "course_categories:list", "course_categories:view", "course_categories:edit", "course_categories:create",
          "marketing_pages:list", "marketing_pages:view", "marketing_pages:edit", "marketing_pages:create",
          "course_reviews:list", "course_reviews:view", "course_reviews:edit",
        ],
      },
      {
        value: "delete",
        label: "Delete / Full",
        permissions: [
          "courses:list", "courses:view", "courses:edit", "courses:create", "courses:delete",
          "course_categories:list", "course_categories:view", "course_categories:edit", "course_categories:create", "course_categories:delete",
          "marketing_pages:list", "marketing_pages:view", "marketing_pages:edit", "marketing_pages:create", "marketing_pages:delete",
          "course_reviews:list", "course_reviews:view", "course_reviews:edit", "course_reviews:delete",
        ],
      },
    ],
  },
  {
    key: "orders",
    name: "Orders",
    levels: [
      { value: "none", label: "None", permissions: [] },
      { value: "view", label: "View only", permissions: ["orders:list", "orders:view"] },
    ],
  },
  {
    key: "coupons",
    name: "Coupons",
    levels: [
      { value: "none", label: "None", permissions: [] },
      { value: "view", label: "View only", permissions: ["coupons:list", "coupons:view"] },
      { value: "edit", label: "Edit (includes view)", permissions: ["coupons:list", "coupons:view", "coupons:edit"] },
      { value: "create", label: "Create (includes view, edit)", permissions: ["coupons:list", "coupons:view", "coupons:edit", "coupons:create"] },
      { value: "delete", label: "Delete / Full", permissions: ["coupons:list", "coupons:view", "coupons:edit", "coupons:create", "coupons:delete"] },
    ],
  },
  {
    key: "payment_links",
    name: "Payment Links",
    levels: [
      { value: "none", label: "None", permissions: [] },
      { value: "view", label: "View only", permissions: ["payment_links:list", "payment_links:view"] },
      { value: "edit", label: "Edit (includes view)", permissions: ["payment_links:list", "payment_links:view", "payment_links:edit"] },
      { value: "create", label: "Create (includes view, edit)", permissions: ["payment_links:list", "payment_links:view", "payment_links:edit", "payment_links:create"] },
      { value: "delete", label: "Delete / Full", permissions: ["payment_links:list", "payment_links:view", "payment_links:edit", "payment_links:create", "payment_links:delete"] },
    ],
  },
  {
    key: "live_sessions",
    name: "Live Sessions",
    levels: [
      { value: "none", label: "None", permissions: [] },
      { value: "view", label: "View only", permissions: ["live_sessions:list", "live_sessions:view"] },
    ],
  },
  {
    key: "contact_inquiries",
    name: "Contact Inquiries",
    levels: [
      { value: "none", label: "None", permissions: [] },
      { value: "view", label: "View only", permissions: ["contact_inquiries:list", "contact_inquiries:view"] },
    ],
  },
  {
    key: "affiliate",
    name: "Affiliate",
    levels: [
      { value: "none", label: "None", permissions: [] },
      { value: "view", label: "View only", permissions: ["affiliate:list", "affiliate:view"] },
    ],
  },
  {
    key: "downloads",
    name: "Downloads",
    levels: [
      { value: "none", label: "None", permissions: [] },
      { value: "view", label: "View only", permissions: ["downloads:list", "downloads:view"] },
      { value: "edit", label: "Edit (includes view)", permissions: ["downloads:list", "downloads:view", "downloads:edit"] },
      { value: "create", label: "Create (includes view, edit)", permissions: ["downloads:list", "downloads:view", "downloads:edit", "downloads:create"] },
      { value: "delete", label: "Delete / Full", permissions: ["downloads:list", "downloads:view", "downloads:edit", "downloads:create", "downloads:delete"] },
    ],
  },
  {
    key: "global_settings",
    name: "Global Settings (Common, Marketing, Payment Gateway)",
    levels: [
      { value: "none", label: "None", permissions: [] },
      {
        value: "view",
        label: "View only",
        permissions: ["global_settings:list", "global_settings:view"],
      },
      {
        value: "edit",
        label: "Edit (includes view)",
        permissions: ["global_settings:list", "global_settings:view", "global_settings:edit"],
      },
    ],
  },
  {
    key: "users",
    name: "Users – Course & Membership Allotment",
    levels: [
      { value: "none", label: "None", permissions: [] },
      { value: "view", label: "Allot courses", permissions: ["users:course_allotment"] },
      { value: "edit", label: "Allot courses & memberships", permissions: ["users:course_allotment", "users:membership_allotment"] },
    ],
  },
];

/** Sidebar-aligned groups for the role permission matrix (order matches main nav). */
export type PermissionNavGroup = {
  name: string;
  modules: Array<{ key: string; label?: string }>;
  /** Extra toggles not represented in MODULE_LEVELS rows. */
  standalone?: Array<{ perm: string; label: string }>;
};

export const PERMISSION_NAV_GROUPS: PermissionNavGroup[] = [
  {
    name: "Dashboard",
    modules: [],
    standalone: [{ perm: "admin:access", label: "Access admin panel" }],
  },
  {
    name: "Articles",
    modules: [{ key: "articles", label: "Articles & blog categories" }],
  },
  {
    name: "Courses",
    modules: [{
      key: "courses",
      label: "Courses, categories, common sections, reviews & marketing pages",
    }],
  },
  { name: "Live Sessions", modules: [{ key: "live_sessions" }] },
  { name: "Orders", modules: [{ key: "orders" }] },
  { name: "Coupons", modules: [{ key: "coupons" }] },
  { name: "Payment Links", modules: [{ key: "payment_links" }] },
  { name: "Memberships", modules: [{ key: "memberships" }] },
  { name: "Media", modules: [{ key: "media" }] },
  {
    name: "Page Content",
    modules: [
      { key: "content" },
      { key: "banners", label: "Popup Banners" },
    ],
  },
  { name: "Google Reviews", modules: [{ key: "google_reviews" }] },
  { name: "Testimonials", modules: [{ key: "testimonials" }] },
  { name: "Our Products", modules: [{ key: "products" }] },
  { name: "FAQ", modules: [{ key: "faq" }] },
  { name: "Professions", modules: [{ key: "professions" }] },
  { name: "Contact Inquiries", modules: [{ key: "contact_inquiries" }] },
  {
    name: "Newsletter",
    modules: [{ key: "newsletter" }],
    standalone: [{ perm: "newsletter:send", label: "Send campaigns" }],
  },
  { name: "SEO Metadata", modules: [{ key: "seo" }] },
  { name: "Role Management", modules: [{ key: "roles" }] },
  { name: "Admin Users", modules: [{ key: "admin_users", label: "Admin panel users" }] },
  {
    name: "Users (Students)",
    modules: [
      { key: "students", label: "Student accounts" },
      { key: "users", label: "Course & membership allotment" },
    ],
  },
  { name: "Affiliate", modules: [{ key: "affiliate" }] },
  { name: "Downloads", modules: [{ key: "downloads" }] },
  { name: "Global Settings", modules: [{ key: "global_settings" }] },
];

const GROUPED_MODULE_KEYS = new Set(
  PERMISSION_NAV_GROUPS.flatMap((g) => g.modules.map((m) => m.key)),
);

/** Modules not listed in PERMISSION_NAV_GROUPS (shown last). */
export function getUngroupedPermissionModules(): ModuleConfig[] {
  return MODULE_LEVELS.filter((m) => !GROUPED_MODULE_KEYS.has(m.key));
}

/** Get display label for a module row inside a nav group. */
export function getPermissionModuleLabel(moduleKey: string, override?: string): string {
  if (override) return override;
  const config = MODULE_LEVELS.find((m) => m.key === moduleKey);
  return config?.name ?? moduleKey;
}

/** Get the effective level for a module from a list of permissions (e.g. from API). */
export function getLevelForModule(moduleKey: string, permissions: string[]): ModuleLevel {
  const config = MODULE_LEVELS.find((m) => m.key === moduleKey);
  if (!config) return "none";
  const perms = new Set(permissions);
  for (let i = config.levels.length - 1; i >= 0; i--) {
    const level = config.levels[i];
    if (level.value === "none") continue;
    if (level.permissions.every((p) => perms.has(p))) return level.value as ModuleLevel;
  }
  return "none";
}

/** Get all permission keys that belong to a module (for replacing when level changes). */
export function getModulePermissionKeys(moduleKey: string): string[] {
  const config = MODULE_LEVELS.find((m) => m.key === moduleKey);
  if (!config) return [];
  const keys = new Set<string>();
  config.levels.forEach((l) => l.permissions.forEach((p) => keys.add(p)));
  return [...keys];
}

/** UI columns: View (list+view), Edit, Add (create), Delete — in privilege order. */
export type ModuleActionKey = "view" | "edit" | "add" | "delete";

const LEVEL_RANK: Record<ModuleLevel, number> = {
  none: 0,
  view: 1,
  edit: 2,
  create: 3,
  delete: 4,
};

/** Which actions exist for this module (from MODULE_LEVELS). */
export function getModuleAvailableActions(moduleKey: string): ModuleActionKey[] {
  const config = MODULE_LEVELS.find((m) => m.key === moduleKey);
  if (!config) return [];
  const levelValues = new Set(config.levels.map((l) => l.value));
  const out: ModuleActionKey[] = [];
  if (levelValues.has("view")) out.push("view");
  if (levelValues.has("edit")) out.push("edit");
  if (levelValues.has("create")) out.push("add");
  if (levelValues.has("delete")) out.push("delete");
  return out;
}

export function maxLevelForModule(moduleKey: string): ModuleLevel {
  const config = MODULE_LEVELS.find((m) => m.key === moduleKey);
  if (!config) return "none";
  const ranked = config.levels.filter((l) => l.value !== "none");
  const last = ranked[ranked.length - 1];
  return (last?.value ?? "none") as ModuleLevel;
}

export function moduleLevelRank(level: ModuleLevel): number {
  return LEVEL_RANK[level] ?? 0;
}

/** Map UI action to the MODULE_LEVELS level that turns that action on. */
export function actionToModuleLevel(action: ModuleActionKey): ModuleLevel {
  switch (action) {
    case "view":
      return "view";
    case "edit":
      return "edit";
    case "add":
      return "create";
    case "delete":
      return "delete";
  }
}

/** Level to step down to when turning an action off (clears that action and stronger). */
export function levelAfterTurningActionOff(action: ModuleActionKey): ModuleLevel {
  switch (action) {
    case "delete":
      return "create";
    case "add":
      return "edit";
    case "edit":
      return "view";
    case "view":
      return "none";
  }
}

export function maxModuleLevel(a: ModuleLevel, b: ModuleLevel): ModuleLevel {
  // const order: ModuleLevel[] = ["none", "view", "edit", "create", "delete"];
  return moduleLevelRank(a) >= moduleLevelRank(b) ? a : b;
}

/** Whether an action column is on for the current module level. */
export function isActionChecked(
  moduleKey: string,
  action: ModuleActionKey,
  level: ModuleLevel
): boolean {
  const available = getModuleAvailableActions(moduleKey);
  if (!available.includes(action)) return false;
  return moduleLevelRank(level) >= moduleLevelRank(actionToModuleLevel(action));
}
