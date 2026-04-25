/**
 * Public contact page (slug `contact`) — stored in `cms_pages` as
 * `title`, `content` (HTML), and `meta` (all other fields).
 * Keep in sync with `cafestudy-fe` `lib/contact-page-data.ts`.
 */
export const CONTACT_PAGE_DEFAULTS = {
  title: "Contact Us",
  heading: "Get In Touch",
  description:
    "Have questions or feedback? Reach out to us. We'd love to hear from you.",
  email: "info@studycafe.in",
  phone: "+91 1234567890",
  address: "Studycafe Private Limited, New Delhi, India",
  submitButtonText: "Send Message",
  formHeading: "Send us a message",
  emailCardTitle: "Email",
  phoneCardTitle: "Phone",
  officeCardTitle: "Office",
  workingHoursTitle: "Working hours",
  workingHoursLine1: "Monday to Saturday",
  workingHoursLine2: "10:00 AM to 06:00 PM",
  marketingBlurb: "Talk to a member of our marketing team",
  marketingEmail: "marketing@studycafe.in",
  marketingCta: "Contact marketing team",
  accountsBlurb: "Talk to a member of our accounts team",
  accountsEmail: "accounts@studycafe.in",
  accountsCta: "Contact accounting team",
  followTitle: "Follow us",
  followDescription: "Stay connected for the latest updates, tips, and educational content.",
  socialLinkedin: "https://www.linkedin.com/company/studycafe",
  socialX: "",
  socialInstagram: "",
  socialFacebook: "",
  socialTelegram: "",
  socialYoutube: "",
  mapTitle: "Find us on the map",
  mapDescription:
    "Visit our office for in-person consultations or to pick up your course materials.",
};

export type ContactPageFormState = typeof CONTACT_PAGE_DEFAULTS;

function pickString(
  m: Record<string, unknown>,
  key: string,
  fallback: string,
  allowEmpty = false
): string {
  const v = m[key];
  if (typeof v !== "string") return fallback;
  if (!allowEmpty && v.trim() === "") return fallback;
  return v;
}

/** Merge API row + defaults into a full form state. */
export function contactFormStateFromCms(
  data: { title: string | null; content: string | null; meta: Record<string, unknown> | null } | null
): ContactPageFormState {
  const m = (data?.meta || {}) as Record<string, unknown>;
  const d = CONTACT_PAGE_DEFAULTS;
  if (!data) return { ...d };
  return {
    title: data.title?.trim() || d.title,
    heading: pickString(m, "heading", d.heading),
    description: typeof data.content === "string" && data.content.trim() ? data.content : d.description,
    email: pickString(m, "email", d.email),
    phone: pickString(m, "phone", d.phone),
    address: pickString(m, "address", d.address),
    submitButtonText: pickString(m, "submitButtonText", d.submitButtonText),
    formHeading: pickString(m, "formHeading", d.formHeading),
    emailCardTitle: pickString(m, "emailCardTitle", d.emailCardTitle),
    phoneCardTitle: pickString(m, "phoneCardTitle", d.phoneCardTitle),
    officeCardTitle: pickString(m, "officeCardTitle", d.officeCardTitle),
    workingHoursTitle: pickString(m, "workingHoursTitle", d.workingHoursTitle),
    workingHoursLine1: pickString(m, "workingHoursLine1", d.workingHoursLine1),
    workingHoursLine2: pickString(m, "workingHoursLine2", d.workingHoursLine2),
    marketingBlurb: pickString(m, "marketingBlurb", d.marketingBlurb),
    marketingEmail: pickString(m, "marketingEmail", d.marketingEmail),
    marketingCta: pickString(m, "marketingCta", d.marketingCta),
    accountsBlurb: pickString(m, "accountsBlurb", d.accountsBlurb),
    accountsEmail: pickString(m, "accountsEmail", d.accountsEmail),
    accountsCta: pickString(m, "accountsCta", d.accountsCta),
    followTitle: pickString(m, "followTitle", d.followTitle),
    followDescription: pickString(m, "followDescription", d.followDescription),
    socialLinkedin: pickString(m, "socialLinkedin", d.socialLinkedin, true),
    socialX: pickString(m, "socialX", d.socialX, true),
    socialInstagram: pickString(m, "socialInstagram", d.socialInstagram, true),
    socialFacebook: pickString(m, "socialFacebook", d.socialFacebook, true),
    socialTelegram: pickString(m, "socialTelegram", d.socialTelegram, true),
    socialYoutube: pickString(m, "socialYoutube", d.socialYoutube, true),
    mapTitle: pickString(m, "mapTitle", d.mapTitle),
    mapDescription: pickString(m, "mapDescription", d.mapDescription),
  };
}

export function buildContactMeta(
  c: ContactPageFormState
): Record<string, string> {
  return {
    heading: c.heading,
    email: c.email,
    phone: c.phone,
    address: c.address,
    submitButtonText: c.submitButtonText,
    formHeading: c.formHeading,
    emailCardTitle: c.emailCardTitle,
    phoneCardTitle: c.phoneCardTitle,
    officeCardTitle: c.officeCardTitle,
    workingHoursTitle: c.workingHoursTitle,
    workingHoursLine1: c.workingHoursLine1,
    workingHoursLine2: c.workingHoursLine2,
    marketingBlurb: c.marketingBlurb,
    marketingEmail: c.marketingEmail,
    marketingCta: c.marketingCta,
    accountsBlurb: c.accountsBlurb,
    accountsEmail: c.accountsEmail,
    accountsCta: c.accountsCta,
    followTitle: c.followTitle,
    followDescription: c.followDescription,
    socialLinkedin: c.socialLinkedin,
    socialX: c.socialX,
    socialInstagram: c.socialInstagram,
    socialFacebook: c.socialFacebook,
    socialTelegram: c.socialTelegram,
    socialYoutube: c.socialYoutube,
    mapTitle: c.mapTitle,
    mapDescription: c.mapDescription,
  };
}
