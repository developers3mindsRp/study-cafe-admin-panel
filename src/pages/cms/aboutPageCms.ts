/**
 * About page CMS shape (mirrors cafestudy-fe). Keep defaults + merge in sync with
 * cafestudy-fe/src/lib/about-page-data.ts when changing the public About page.
 */

import type { CmsPageRecord } from "../../api/cmsPages";

export interface PersonSocial {
  instagram?: string;
  twitter?: string;
  linkedin?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  image: string;
  social?: PersonSocial;
}

export interface Milestone {
  year: string;
  title: string;
  description: string;
}

export interface StatItem {
  title: string;
  value: string;
  icon: string;
}

export interface MissionCard {
  title: string;
  description: string;
  icon: string;
}

export interface LeaderPerson {
  name: string;
  role: string;
  image: string;
  linkedin?: string;
}

export interface AboutPageData {
  pageTitle: string;
  hero: { title: string; subtitle: string; backgroundImage: string };
  description: { heading: string; bodyHtml: string; imageUrl: string };
  stats: StatItem[];
  mission: { sectionTitle: string; body: string; cards: [MissionCard, MissionCard] };
  journey: { sectionTitle: string; milestones: Milestone[] };
  leadership: { title: string; subtitle: string; leaders: LeaderPerson[] };
  managers: { sectionTitle: string; members: TeamMember[] };
  team: { sectionTitle: string; members: TeamMember[] };
  awards: { sectionTitle: string; images: string[] };
  featuredIn: { sectionTitle: string; logos: string[] };
  gallery: { images: string[] };
  message: {
    getInTouchTitle: string;
    companyName: string;
    address: string;
    founderSectionTitle: string;
    founderMessage: string;
    founderName: string;
    founderRole: string;
    founderImage: string;
    cardBackgroundImage: string;
  };
}

const DEFAULT_STATS: StatItem[] = [
  { title: "Founded", value: "2011", icon: "/images/founded.svg" },
  { title: "Happy Students", value: "50K+", icon: "/images/students.svg" },
  { title: "Courses", value: "50+", icon: "/images/courses.svg" },
  { title: "Instructors", value: "20+", icon: "/images/instruct.svg" },
];

const DEFAULT_MISSION_CARDS: [MissionCard, MissionCard] = [
  {
    title: "Empower Professionals",
    description:
      "To provide affordable, high-quality technical education accessible to everyone, everywhere.",
    icon: "/images/empower.svg",
  },
  {
    title: "Career Growth",
    description: "To become the leading platform for career upskilling in finance, accounting, and future tech.",
    icon: "/images/growth.svg",
  },
];

const DEFAULT_JOURNEY: Milestone[] = [
  { year: "2011", title: "Website Started", description: "Studycafe Website Started in 2011." },
  { year: "2018", title: "App Launched", description: "Launched StudyCafe Mobile App on Android Platform." },
  {
    year: "2018",
    title: "E-Commerce Launched",
    description: "Launched Studycafe E-Commerce Portal in 2018 to Sell Books and Lectures online.",
  },
  {
    year: "2021",
    title: "Membership Programmes",
    description: "For a Better use Experience, we launched a membership Program for Studycafe Members.",
  },
  {
    year: "2020",
    title: "Company Incorporated",
    description: "Studycafe Private Limited Company Incorporated in July 2020.",
  },
  {
    year: "2020",
    title: "Online Courses",
    description:
      "We started providing online courses on GST, Income Tax, Excel, Tally, Share Market, SAP and on Communication Topics from Apr.",
  },
  {
    year: "2024",
    title: "Lifetime Membership Programmes",
    description: "In the request of the members, we have launched a lifetime membership program for the Members.",
  },
];

const DEFAULT_MANAGERS: TeamMember[] = [
  { name: "Raja Mehta", role: "Operation Manager", image: "/images/raja.svg", social: {} },
  { name: "Simran Chawla", role: "Motion Graphic Designer", image: "/images/simran.svg", social: {} },
  { name: "Meetu Kumari", role: "Content Manager", image: "/images/meetu.svg", social: {} },
  { name: "Janvi", role: "Digital Marketing Executive", image: "/images/janvi.svg", social: {} },
];

const DEFAULT_TEAM: TeamMember[] = [
  { name: "Saloni Kumari", role: "Content Writer", image: "/images/saloni.svg", social: {} },
  { name: "Nidhi", role: "Content Writer", image: "/images/nidhi.svg", social: {} },
  { name: "Vanshika Verma", role: "Content Writer", image: "/images/vanshika.svg", social: {} },
  { name: "Dharna Chaudhary", role: "Digital Marketing Executive", image: "/images/dharna.svg", social: {} },
  { name: "Kajal", role: "Digital Marketing Executive", image: "/images/kajal.svg", social: {} },
  { name: "Yuyuts Sisodia", role: "Accounts Executive", image: "/images/yuyuts.svg", social: {} },
];

const DEFAULT_LEADERS: LeaderPerson[] = [
  { name: "CA Deepak Gupta", role: "Founder", image: "/images/deepak.svg", linkedin: "" },
  { name: "CA Pratibha Goyal", role: "Co Founder", image: "/images/pratibha.svg", linkedin: "" },
];

const DESCRIPTION_BODY_DEFAULT = `<p>Studycafe is D2C Edtech Company. Studycafe provides a range of industry-specific modern courses on ChatGPT, AI Tools, CA Practice Automation, How to Grow CA Practice, Business Automation, Power BI, Advance Microsoft Excel, Microsoft PowerPoint, Income Tax, TDS, GST, SAP, and Business Communication, etc. The membership subscription provided by Studycafe helps in availing highly customized and curated services catering to the needs of the member. The platform strives to empower its learning community and open several opportunities for them in the modern market.
At Studycafe we do provide online Courses related to ChatGPT, AI Tools, CA Practice Automation, How to Grow CA Practice, Business Automation, Tally, Excel, Income Tax, TDS, GST, SAP, and Business Communication-related Courses. We launched our e-commerce services and Mobile app in 2018. We have started a Membership Program for the users as well in 2021. Users who are subscribe to our membership can claim several benefits of the lifetime membership.
Studycafe started in the year 2011. Since 2011 we are continuously sharing informative content with our users. We started providing Online courses from 2020 Onward for Students and Professionals.
CA Deepak Gupta - Founder- StudyCafe Private Limited</p>`;

const MISSION_BODY_DEFAULT = `<p>Our mission is to empower professionals and students alike by providing them with access to the most comprehensive and relevant content and courses across a diverse range of fields, including ChatGPT, AI Tools, CA Practice Automation, Business Automation, Power BI, Advanced Microsoft Excel, Microsoft PowerPoint, Income Tax, TDS, GST, SAP, and Business Communication. We believe in equipping individuals with the knowledge and skills they need to excel in today's dynamic and ever-evolving professional landscape. Our vision is to become the go-to platform where learners can discover, acquire, and master the tools and expertise necessary to thrive in their careers, making a positive impact on their organizations and the world at large.</p>`;

const FOUNDER_MESSAGE_DEFAULT = `Studycafe is D2C Edtech Company. Studycafe provides a range of industry-specific modern courses on ChatGPT, AI Tools, CA Practice Automation, How to Grow CA Practice, Business Automation, Power BI, Advance Microsoft Excel, Microsoft PowerPoint, Income Tax, TDS, GST, SAP, and Business Communication, etc. The membership subscription provided by Studycafe helps in availing highly customized and curated services catering to the needs of the member. The platform strives to empower its learning community and open several opportunities for them in the modern market.`;

export const DEFAULT_ABOUT_PAGE_DATA: AboutPageData = {
  pageTitle: "About Us",
  hero: {
    title: "About Us",
    subtitle: "Empowering Modern Skills for Career Growth",
    backgroundImage: "/images/about-cover.svg",
  },
  description: {
    heading: "StudyCafe",
    bodyHtml: DESCRIPTION_BODY_DEFAULT,
    imageUrl: "/images/bg-about.svg",
  },
  stats: DEFAULT_STATS.map((s) => ({ ...s })),
  mission: {
    sectionTitle: "Our Mission",
    body: MISSION_BODY_DEFAULT,
    cards: [{ ...DEFAULT_MISSION_CARDS[0] }, { ...DEFAULT_MISSION_CARDS[1] }],
  },
  journey: {
    sectionTitle: "Our Journey",
    milestones: DEFAULT_JOURNEY.map((m) => ({ ...m })),
  },
  leadership: {
    title: "Leadership & Team",
    subtitle: "The people behind Studycafe's success",
    leaders: DEFAULT_LEADERS.map((l) => ({ ...l })),
  },
  managers: {
    sectionTitle: "Managers",
    members: DEFAULT_MANAGERS.map((m) => ({ ...m, social: m.social ? { ...m.social } : undefined })),
  },
  team: {
    sectionTitle: "Team Members",
    members: DEFAULT_TEAM.map((m) => ({ ...m, social: m.social ? { ...m.social } : undefined })),
  },
  awards: {
    sectionTitle: "Awards & Recognition",
    images: ["/images/certificates1.svg", "/images/certificates1.svg"],
  },
  featuredIn: {
    sectionTitle: "Featured In",
    logos: ["/images/hc.svg", "/images/LT.svg", "/images/ANI.svg", "/images/the-print.svg", "/images/zee.svg", "/images/dailyhunt.svg"],
  },
  gallery: {
    images: ["/images/g1.png", "/images/g2.png", "/images/g3.png", "/images/g4.png"],
  },
  message: {
    getInTouchTitle: "Get In Touch",
    companyName: "StudyCafe Private Limited",
    address: "1003, 10th Floor, Modi Tower 98, Nehru place,\nDelhi, 110019 - India",
    founderSectionTitle: "A Message from Our Founder",
    founderMessage: FOUNDER_MESSAGE_DEFAULT,
    founderName: "CA Deepak Gupta",
    founderRole: "Founder",
    founderImage: "/images/founder.svg",
    cardBackgroundImage: "/images/about-bg.svg",
  },
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function mergeStatItem(base: StatItem, incoming: unknown): StatItem {
  if (!isRecord(incoming)) return { ...base };
  return {
    title: typeof incoming.title === "string" ? incoming.title : base.title,
    value: typeof incoming.value === "string" ? incoming.value : base.value,
    icon: typeof incoming.icon === "string" ? incoming.icon : base.icon,
  };
}

function mergeMissionCard(base: MissionCard, incoming: unknown): MissionCard {
  if (!isRecord(incoming)) return { ...base };
  return {
    title: typeof incoming.title === "string" ? incoming.title : base.title,
    description: typeof incoming.description === "string" ? incoming.description : base.description,
    icon: typeof incoming.icon === "string" ? incoming.icon : base.icon,
  };
}

function normalizeSocialHref(raw?: string): string | undefined {
  if (!raw || !String(raw).trim()) return undefined;
  const v = String(raw).trim();
  if (v.startsWith("/images/")) return undefined;
  return v;
}

function compactSocial(base: PersonSocial | undefined, incoming?: Record<string, unknown>): PersonSocial {
  const ig = normalizeSocialHref(
    incoming && typeof incoming.instagram === "string"
      ? incoming.instagram
      : base?.instagram
  );
  const tw = normalizeSocialHref(
    incoming && typeof incoming.twitter === "string" ? incoming.twitter : base?.twitter
  );
  const li = normalizeSocialHref(
    incoming && typeof incoming.linkedin === "string" ? incoming.linkedin : base?.linkedin
  );
  const out: PersonSocial = {};
  if (ig) out.instagram = ig;
  if (tw) out.twitter = tw;
  if (li) out.linkedin = li;
  return out;
}

function mergeTeamMember(base: TeamMember, incoming: unknown): TeamMember {
  if (!isRecord(incoming)) {
    const social = compactSocial(base.social, undefined);
    return { ...base, social: Object.keys(social).length ? social : {} };
  }
  const socialIn = incoming.social;
  const social = isRecord(socialIn)
    ? compactSocial(base.social, socialIn)
    : compactSocial(base.social, undefined);
  return {
    name: typeof incoming.name === "string" ? incoming.name : base.name,
    role: typeof incoming.role === "string" ? incoming.role : base.role,
    image: typeof incoming.image === "string" ? incoming.image : base.image,
    social: Object.keys(social).length ? social : {},
  };
}

function mergeMilestone(base: Milestone, incoming: unknown): Milestone {
  if (!isRecord(incoming)) return { ...base };
  return {
    year: typeof incoming.year === "string" ? incoming.year : base.year,
    title: typeof incoming.title === "string" ? incoming.title : base.title,
    description: typeof incoming.description === "string" ? incoming.description : base.description,
  };
}

function mergeLeader(base: LeaderPerson, incoming: unknown): LeaderPerson {
  if (!isRecord(incoming)) return { ...base, linkedin: base.linkedin ?? "" };
  return {
    name: typeof incoming.name === "string" ? incoming.name : base.name,
    role: typeof incoming.role === "string" ? incoming.role : base.role,
    image: typeof incoming.image === "string" ? incoming.image : base.image,
    linkedin:
      typeof incoming.linkedin === "string"
        ? incoming.linkedin
        : (base.linkedin ?? ""),
  };
}

export function mergeAboutPageFromCmsRecord(page: CmsPageRecord | null): AboutPageData {
  const out: AboutPageData = JSON.parse(JSON.stringify(DEFAULT_ABOUT_PAGE_DATA)) as AboutPageData;
  if (!page) return out;

  if (page.title && String(page.title).trim()) out.pageTitle = String(page.title);
  if (page.content && String(page.content).trim()) out.description.bodyHtml = String(page.content);

  const m = page.meta && typeof page.meta === "object" ? (page.meta as Record<string, unknown>) : {};

  if (isRecord(m.hero)) {
    const h = m.hero;
    if (typeof h.title === "string") out.hero.title = h.title;
    if (typeof h.subtitle === "string") out.hero.subtitle = h.subtitle;
    if (typeof h.backgroundImage === "string") out.hero.backgroundImage = h.backgroundImage;
  }

  if (isRecord(m.description)) {
    const d = m.description;
    if (typeof d.heading === "string") out.description.heading = d.heading;
    if (typeof d.imageUrl === "string") out.description.imageUrl = d.imageUrl;
  }

  if (Array.isArray(m.stats) && m.stats.length > 0) {
    out.stats = m.stats.map((item, i) => mergeStatItem(out.stats[i] ?? DEFAULT_STATS[i % DEFAULT_STATS.length], item));
  }

  if (isRecord(m.mission)) {
    const ms = m.mission;
    if (typeof ms.sectionTitle === "string") out.mission.sectionTitle = ms.sectionTitle;
    if (typeof ms.body === "string") out.mission.body = ms.body;
    if (Array.isArray(ms.cards) && ms.cards.length >= 2) {
      out.mission.cards = [
        mergeMissionCard(out.mission.cards[0], ms.cards[0]),
        mergeMissionCard(out.mission.cards[1], ms.cards[1]),
      ];
    }
  } else if (typeof m.mission === "string") {
    out.mission.body = m.mission;
  }
  if (typeof m.vision === "string" && m.vision.trim()) {
    out.mission.body = `${out.mission.body}<p>${m.vision}</p>`;
  }

  if (isRecord(m.journey)) {
    const j = m.journey;
    if (typeof j.sectionTitle === "string") out.journey.sectionTitle = j.sectionTitle;
    if (Array.isArray(j.milestones) && j.milestones.length > 0) {
      out.journey.milestones = j.milestones.map((item, i) =>
        mergeMilestone(out.journey.milestones[i] ?? DEFAULT_JOURNEY[i % DEFAULT_JOURNEY.length], item)
      );
    }
  }

  if (isRecord(m.leadership)) {
    const l = m.leadership;
    if (typeof l.title === "string") out.leadership.title = l.title;
    if (typeof l.subtitle === "string") out.leadership.subtitle = l.subtitle;
    if (Array.isArray(l.leaders) && l.leaders.length > 0) {
      out.leadership.leaders = l.leaders.map((item, i) =>
        mergeLeader(out.leadership.leaders[i] ?? DEFAULT_LEADERS[i % DEFAULT_LEADERS.length], item)
      );
    }
  }

  if (isRecord(m.managers)) {
    const mg = m.managers;
    if (typeof mg.sectionTitle === "string") out.managers.sectionTitle = mg.sectionTitle;
    if (Array.isArray(mg.members) && mg.members.length > 0) {
      out.managers.members = mg.members.map((item, i) =>
        mergeTeamMember(out.managers.members[i] ?? DEFAULT_MANAGERS[i % DEFAULT_MANAGERS.length], item)
      );
    }
  }

  if (isRecord(m.team)) {
    const t = m.team;
    if (typeof t.sectionTitle === "string") out.team.sectionTitle = t.sectionTitle;
    if (Array.isArray(t.members) && t.members.length > 0) {
      out.team.members = t.members.map((item, i) =>
        mergeTeamMember(out.team.members[i] ?? DEFAULT_TEAM[i % DEFAULT_TEAM.length], item)
      );
    }
  }

  if (isRecord(m.awards)) {
    const a = m.awards;
    if (typeof a.sectionTitle === "string") out.awards.sectionTitle = a.sectionTitle;
    if (Array.isArray(a.images) && a.images.length > 0) {
      out.awards.images = a.images.filter((u): u is string => typeof u === "string" && u.length > 0);
    }
  }

  if (isRecord(m.featuredIn)) {
    const f = m.featuredIn;
    if (typeof f.sectionTitle === "string") out.featuredIn.sectionTitle = f.sectionTitle;
    if (Array.isArray(f.logos) && f.logos.length > 0) {
      out.featuredIn.logos = f.logos.filter((u): u is string => typeof u === "string" && u.length > 0);
    }
  }

  if (isRecord(m.gallery) && Array.isArray(m.gallery.images) && m.gallery.images.length > 0) {
    out.gallery.images = m.gallery.images.filter((u): u is string => typeof u === "string" && u.length > 0);
  }

  if (isRecord(m.message)) {
    const msg = m.message;
    if (typeof msg.getInTouchTitle === "string") out.message.getInTouchTitle = msg.getInTouchTitle;
    if (typeof msg.companyName === "string") out.message.companyName = msg.companyName;
    if (typeof msg.address === "string") out.message.address = msg.address;
    if (typeof msg.founderSectionTitle === "string") out.message.founderSectionTitle = msg.founderSectionTitle;
    if (typeof msg.founderMessage === "string") out.message.founderMessage = msg.founderMessage;
    if (typeof msg.founderName === "string") out.message.founderName = msg.founderName;
    if (typeof msg.founderRole === "string") out.message.founderRole = msg.founderRole;
    if (typeof msg.founderImage === "string") out.message.founderImage = msg.founderImage;
    if (typeof msg.cardBackgroundImage === "string") out.message.cardBackgroundImage = msg.cardBackgroundImage;
  }

  return out;
}

export function aboutPageDataToMetaPayload(data: AboutPageData): Record<string, unknown> {
  return {
    hero: data.hero,
    description: {
      heading: data.description.heading,
      imageUrl: data.description.imageUrl,
    },
    stats: data.stats,
    mission: data.mission,
    journey: data.journey,
    leadership: data.leadership,
    managers: data.managers,
    team: data.team,
    awards: data.awards,
    featuredIn: data.featuredIn,
    gallery: data.gallery,
    message: data.message,
  };
}
