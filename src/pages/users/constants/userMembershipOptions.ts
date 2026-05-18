/** Slugs must match `users.membership` values stored by the API. */

export const USER_MEMBERSHIP_FILTER_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "basic", label: "Basic" },
  { value: "pro", label: "Pro" },
  { value: "premium", label: "Premium" },
  { value: "ultimate", label: "Ultimate" },
] as const;

/** First option is "all" for export modal and similar UIs. */
export const USER_MEMBERSHIP_EXPORT_OPTIONS = [
  { value: "", label: "All memberships" },
  ...USER_MEMBERSHIP_FILTER_OPTIONS,
];
