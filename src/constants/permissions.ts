/**
 * Permission keys for role-based access.
 * Format: "module:action" or "module:submodule:action".
 * Use these with RequirePermission and for hiding nav items.
 */

// Articles
export const PERM_ARTICLES_LIST = "articles:list";
export const PERM_ARTICLES_VIEW = "articles:view";
export const PERM_ARTICLES_CREATE = "articles:create";
export const PERM_ARTICLES_EDIT = "articles:edit";
export const PERM_ARTICLES_DELETE = "articles:delete";

// Content / CMS
export const PERM_CONTENT_LIST = "content:list";
export const PERM_CONTENT_VIEW = "content:view";
export const PERM_CONTENT_EDIT = "content:edit";

// SEO Metadata
export const PERM_SEO_LIST = "seo:list";
export const PERM_SEO_VIEW = "seo:view";
export const PERM_SEO_CREATE = "seo:create";
export const PERM_SEO_EDIT = "seo:edit";
export const PERM_SEO_DELETE = "seo:delete";

// Memberships
export const PERM_MEMBERSHIPS_LIST = "memberships:list";
export const PERM_MEMBERSHIPS_VIEW = "memberships:view";
export const PERM_MEMBERSHIPS_CREATE = "memberships:create";
export const PERM_MEMBERSHIPS_EDIT = "memberships:edit";
export const PERM_MEMBERSHIPS_DELETE = "memberships:delete";

// Testimonials
export const PERM_TESTIMONIALS_LIST = "testimonials:list";
export const PERM_TESTIMONIALS_VIEW = "testimonials:view";
export const PERM_TESTIMONIALS_CREATE = "testimonials:create";
export const PERM_TESTIMONIALS_EDIT = "testimonials:edit";
export const PERM_TESTIMONIALS_DELETE = "testimonials:delete";

// FAQ
export const PERM_FAQ_LIST = "faq:list";
export const PERM_FAQ_VIEW = "faq:view";
export const PERM_FAQ_CREATE = "faq:create";
export const PERM_FAQ_EDIT = "faq:edit";
export const PERM_FAQ_DELETE = "faq:delete";

// Newsletter
export const PERM_NEWSLETTER_LIST = "newsletter:list";
export const PERM_NEWSLETTER_CREATE = "newsletter:create";
export const PERM_NEWSLETTER_EDIT = "newsletter:edit";
export const PERM_NEWSLETTER_DELETE = "newsletter:delete";
export const PERM_NEWSLETTER_SEND = "newsletter:send";

// Courses
export const PERM_COURSES_LIST = "courses:list";
export const PERM_COURSES_VIEW = "courses:view";
export const PERM_COURSES_CREATE = "courses:create";
export const PERM_COURSES_EDIT = "courses:edit";
export const PERM_COURSES_DELETE = "courses:delete";

// Orders
export const PERM_ORDERS_LIST = "orders:list";
export const PERM_ORDERS_VIEW = "orders:view";

// Coupons
export const PERM_COUPONS_LIST = "coupons:list";
export const PERM_COUPONS_VIEW = "coupons:view";
export const PERM_COUPONS_CREATE = "coupons:create";
export const PERM_COUPONS_EDIT = "coupons:edit";
export const PERM_COUPONS_DELETE = "coupons:delete";

// Payment Links
export const PERM_PAYMENT_LINKS_LIST = "payment_links:list";
export const PERM_PAYMENT_LINKS_VIEW = "payment_links:view";
export const PERM_PAYMENT_LINKS_CREATE = "payment_links:create";
export const PERM_PAYMENT_LINKS_EDIT = "payment_links:edit";
export const PERM_PAYMENT_LINKS_DELETE = "payment_links:delete";

// Live Sessions
export const PERM_LIVE_SESSIONS_LIST = "live_sessions:list";
export const PERM_LIVE_SESSIONS_VIEW = "live_sessions:view";

// Contact Inquiries
export const PERM_CONTACT_INQUIRIES_LIST = "contact_inquiries:list";
export const PERM_CONTACT_INQUIRIES_VIEW = "contact_inquiries:view";

// Affiliate
export const PERM_AFFILIATE_LIST = "affiliate:list";
export const PERM_AFFILIATE_VIEW = "affiliate:view";

// Downloads
export const PERM_DOWNLOADS_LIST = "downloads:list";
export const PERM_DOWNLOADS_VIEW = "downloads:view";
export const PERM_DOWNLOADS_CREATE = "downloads:create";
export const PERM_DOWNLOADS_EDIT = "downloads:edit";
export const PERM_DOWNLOADS_DELETE = "downloads:delete";

// Admin (panel gate)
export const PERM_ADMIN_ACCESS = "admin:access";

// Banners
export const PERM_BANNERS_LIST = "banners:list";
export const PERM_BANNERS_VIEW = "banners:view";
export const PERM_BANNERS_CREATE = "banners:create";
export const PERM_BANNERS_EDIT = "banners:edit";
export const PERM_BANNERS_DELETE = "banners:delete";


// Admin users (CRUD for panel users)
export const PERM_ADMIN_USERS_LIST = "admin_users:list";
export const PERM_ADMIN_USERS_VIEW = "admin_users:view";
export const PERM_ADMIN_USERS_CREATE = "admin_users:create";
export const PERM_ADMIN_USERS_EDIT = "admin_users:edit";
export const PERM_ADMIN_USERS_DELETE = "admin_users:delete";

/** All permissions for reference / super_admin grant */
export const ALL_PERMISSIONS = [
  PERM_ARTICLES_LIST,
  PERM_ARTICLES_VIEW,
  PERM_ARTICLES_CREATE,
  PERM_ARTICLES_EDIT,
  PERM_ARTICLES_DELETE,
  PERM_CONTENT_LIST,
  PERM_CONTENT_VIEW,
  PERM_CONTENT_EDIT,
  PERM_SEO_LIST,
  PERM_SEO_VIEW,
  PERM_SEO_CREATE,
  PERM_SEO_EDIT,
  PERM_SEO_DELETE,
  PERM_MEMBERSHIPS_LIST,
  PERM_MEMBERSHIPS_VIEW,
  PERM_MEMBERSHIPS_CREATE,
  PERM_MEMBERSHIPS_EDIT,
  PERM_MEMBERSHIPS_DELETE,
  PERM_TESTIMONIALS_LIST,
  PERM_TESTIMONIALS_VIEW,
  PERM_TESTIMONIALS_CREATE,
  PERM_TESTIMONIALS_EDIT,
  PERM_TESTIMONIALS_DELETE,
  PERM_FAQ_LIST,
  PERM_FAQ_VIEW,
  PERM_FAQ_CREATE,
  PERM_FAQ_EDIT,
  PERM_FAQ_DELETE,
  PERM_NEWSLETTER_LIST,
  PERM_NEWSLETTER_CREATE,
  PERM_NEWSLETTER_EDIT,
  PERM_NEWSLETTER_DELETE,
  PERM_NEWSLETTER_SEND,
  PERM_COURSES_LIST,
  PERM_COURSES_VIEW,
  PERM_COURSES_CREATE,
  PERM_COURSES_EDIT,
  PERM_COURSES_DELETE,
  PERM_ORDERS_LIST,
  PERM_ORDERS_VIEW,
  PERM_COUPONS_LIST,
  PERM_COUPONS_VIEW,
  PERM_COUPONS_CREATE,
  PERM_COUPONS_EDIT,
  PERM_COUPONS_DELETE,
  PERM_PAYMENT_LINKS_LIST,
  PERM_PAYMENT_LINKS_VIEW,
  PERM_PAYMENT_LINKS_CREATE,
  PERM_PAYMENT_LINKS_EDIT,
  PERM_PAYMENT_LINKS_DELETE,
  PERM_LIVE_SESSIONS_LIST,
  PERM_LIVE_SESSIONS_VIEW,
  PERM_CONTACT_INQUIRIES_LIST,
  PERM_CONTACT_INQUIRIES_VIEW,
  PERM_AFFILIATE_LIST,
  PERM_AFFILIATE_VIEW,
  PERM_DOWNLOADS_LIST,
  PERM_DOWNLOADS_VIEW,
  PERM_DOWNLOADS_CREATE,
  PERM_DOWNLOADS_EDIT,
  PERM_DOWNLOADS_DELETE,
  PERM_ADMIN_ACCESS,
  PERM_ADMIN_USERS_LIST,
  PERM_ADMIN_USERS_VIEW,
  PERM_ADMIN_USERS_CREATE,
  PERM_ADMIN_USERS_EDIT,
  PERM_ADMIN_USERS_DELETE,
  PERM_BANNERS_LIST,
  PERM_BANNERS_VIEW,
  PERM_BANNERS_CREATE,
  PERM_BANNERS_EDIT,
  PERM_BANNERS_DELETE,
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];
