/**
 * Block types and data interfaces for the article block-based editor.
 * Block components are reusable across articles, page content, emails, etc.
 */

export type ContentBlockType =
  | "rich_text"
  | "heading"
  | "ad_slot"
  | "cta"
  | "image_with_link"
  | "download_button"
  | "also_read"
  | "membership_cta";

/** Type-specific data for each block type */
export interface RichTextBlockData {
  html: string;
}

export interface HeadingBlockData {
  level: 1 | 2 | 3;
  text: string;
}

export interface AdSlotBlockData {
  adUnitId: string;
  type: "leaderboard" | "rectangle" | "sidebar" | "inline";
}

export interface CTABlockData {
  variant: "promotion" | "course" | "membership";
  title?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  imageUrl?: string;
  /** For course: course ID or slug */
  courseId?: string;
  /** For promotion: promotion ID or slug */
  promotionId?: string;
}

export interface ImageWithLinkBlockData {
  imageUrl: string;
  linkUrl?: string;
  alt?: string;
  caption?: string;
}

export interface DownloadButtonBlockData {
  label: string;
  fileUrl: string;
}

export interface AlsoReadBlockData {
  articleIds: number[];
}

export interface MembershipCTABlockData {
  heading: string;
  buttonText: string;
  buttonUrl: string;
}

export type ContentBlockData =
  | RichTextBlockData
  | HeadingBlockData
  | AdSlotBlockData
  | CTABlockData
  | ImageWithLinkBlockData
  | DownloadButtonBlockData
  | AlsoReadBlockData
  | MembershipCTABlockData;

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  order: number;
  data: ContentBlockData;
}

/** Type guard helpers */
export function isRichTextBlockData(
  data: ContentBlockData
): data is RichTextBlockData {
  return "html" in data;
}

export function isHeadingBlockData(
  data: ContentBlockData
): data is HeadingBlockData {
  return "level" in data && "text" in data;
}

export function isAdSlotBlockData(
  data: ContentBlockData
): data is AdSlotBlockData {
  return "adUnitId" in data && "type" in data;
}

export function isCTABlockData(data: ContentBlockData): data is CTABlockData {
  return "variant" in data;
}

export function isImageWithLinkBlockData(
  data: ContentBlockData
): data is ImageWithLinkBlockData {
  return "imageUrl" in data;
}

export function isDownloadButtonBlockData(
  data: ContentBlockData
): data is DownloadButtonBlockData {
  return "label" in data && "fileUrl" in data;
}

export function isAlsoReadBlockData(
  data: ContentBlockData
): data is AlsoReadBlockData {
  return "articleIds" in data && Array.isArray((data as AlsoReadBlockData).articleIds);
}

export function isMembershipCTABlockData(
  data: ContentBlockData
): data is MembershipCTABlockData {
  return "heading" in data && "buttonText" in data && "buttonUrl" in data;
}

/** Author bio for article footer */
export interface AuthorBio {
  name: string;
  role?: string;
  imageUrl?: string;
  bio?: string;
  socialLinks?: Record<string, string>;
}

/** Article meta fields (includes SEO fields for reuse) */
export interface ArticleMeta {
  title: string;
  /** Subheading shown below the title on the article page */
  subHeading?: string;
  /** Short description (e.g. excerpt) shown on the article page and listings */
  description?: string;
  metaTitle?: string;
  metaDesc?: string;
  slug: string;
  /** SEO fields (reused from MetaFieldsForm) */
  metaKeywords?: string;
  canonicalUrl?: string;
  robots?: "index, follow" | "noindex, nofollow" | "index, nofollow" | "noindex, follow";
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
}

/** Featured image */
export interface FeaturedImage {
  imageUrl: string;
  linkUrl?: string;
  alt?: string;
  caption?: string;
}

/** Full article structure */
export interface Article {
  id: number;
  meta: ArticleMeta;
  featuredImage: FeaturedImage;
  /** Article body: TipTap JSON string (single-document editor). Used for articles. */
  body?: string;
  /** Legacy / courses: block list. Prefer body when present. */
  blocks: ContentBlock[];
  author: AuthorBio;
  tags: string[];
  shareEnabled: boolean;
  status: "Draft" | "Published" | "Archived" | "Scheduled";
}
