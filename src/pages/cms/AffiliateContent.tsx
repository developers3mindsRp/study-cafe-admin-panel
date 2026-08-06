import { useState, useEffect, type ReactNode } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import Checkbox from "../../components/form/input/Checkbox";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import ImageUpload from "../../components/form/ImageUpload";
import { CMS_IMAGE_UPLOAD_PLACEHOLDER } from "../../constants/cmsImageUpload";
import { fetchCmsPageBySlug, updateCmsPage } from "../../api/cmsPages";
import {
  AFFILIATE_SLUG,
  BENEFIT_ICON_OPTIONS,
  DEFAULT_AFFILIATE_PAGE_DATA,
  EMPTY_BENEFIT,
  EMPTY_EARNER,
  EMPTY_FAQ,
  EMPTY_HIGHLIGHT,
  EMPTY_PROMO_CARD,
  EMPTY_SLAB,
  EMPTY_STEP,
  affiliatePageDataToMetaPayload,
  mergeAffiliatePageFromCmsRecord,
  type AffiliateBenefit,
  type AffiliateEarner,
  type AffiliateFaqItem,
  type AffiliateHighlight,
  type AffiliatePageData,
  type AffiliatePromoCard,
  type AffiliateSlab,
  type AffiliateStep,
} from "./affiliatePageCms";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>
      {description ? (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      ) : null}
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

/** One repeatable row with a remove button. */
function Row({
  label,
  onRemove,
  canRemove,
  children,
}: {
  label: string;
  onRemove: () => void;
  canRemove: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="text-sm text-error-500 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
        >
          Remove
        </button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      {label}
    </Button>
  );
}

/** Section heading + subtitle pair, used by nearly every section. */
function HeadingFields({
  title,
  subtitle,
  onTitle,
  onSubtitle,
  subtitleRows = 2,
}: {
  title: string;
  subtitle: string;
  onTitle: (v: string) => void;
  onSubtitle: (v: string) => void;
  subtitleRows?: number;
}) {
  return (
    <>
      <div>
        <Label>Section title</Label>
        <Input value={title} onChange={(e) => onTitle(e.target.value)} />
      </div>
      <div>
        <Label>Section subtitle</Label>
        <TextArea rows={subtitleRows} value={subtitle} onChange={onSubtitle} />
      </div>
    </>
  );
}

export default function AffiliateContent() {
  const [data, setData] = useState<AffiliatePageData>(
    () => JSON.parse(JSON.stringify(DEFAULT_AFFILIATE_PAGE_DATA)) as AffiliatePageData
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    fetchCmsPageBySlug(AFFILIATE_SLUG)
      .then((row) => {
        if (cancelled) return;
        setData(mergeAffiliatePageFromCmsRecord(row));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = () => {
    setSaving(true);
    setStatus("idle");
    updateCmsPage(AFFILIATE_SLUG, {
      title: data.pageTitle,
      meta: affiliatePageDataToMetaPayload(data),
    })
      .then(() => setStatus("saved"))
      .catch(() => setStatus("error"))
      .finally(() => setSaving(false));
  };

  /* ── generic list helpers ──────────────────────────────────────── */

  const patchAt = <T,>(list: T[], index: number, patch: Partial<T>): T[] => {
    const next = [...list];
    next[index] = { ...next[index], ...patch };
    return next;
  };

  const setHighlight = (i: number, patch: Partial<AffiliateHighlight>) =>
    setData((p) => ({ ...p, hero: { ...p.hero, highlights: patchAt(p.hero.highlights, i, patch) } }));

  const setStep = (i: number, patch: Partial<AffiliateStep>) =>
    setData((p) => ({
      ...p,
      howItWorks: { ...p.howItWorks, steps: patchAt(p.howItWorks.steps, i, patch) },
    }));

  const setBenefit = (i: number, patch: Partial<AffiliateBenefit>) =>
    setData((p) => ({ ...p, benefits: { ...p.benefits, items: patchAt(p.benefits.items, i, patch) } }));

  const setSlab = (i: number, patch: Partial<AffiliateSlab>) =>
    setData((p) => ({
      ...p,
      commission: { ...p.commission, slabs: patchAt(p.commission.slabs, i, patch) },
    }));

  const setPromoCard = (i: number, patch: Partial<AffiliatePromoCard>) =>
    setData((p) => ({ ...p, promote: { ...p.promote, cards: patchAt(p.promote.cards, i, patch) } }));

  const setEarner = (i: number, patch: Partial<AffiliateEarner>) =>
    setData((p) => ({ ...p, earners: { ...p.earners, items: patchAt(p.earners.items, i, patch) } }));

  const setFaqItem = (i: number, patch: Partial<AffiliateFaqItem>) =>
    setData((p) => ({ ...p, faq: { ...p.faq, items: patchAt(p.faq.items, i, patch) } }));

  const removeAt = <T,>(list: T[], index: number): T[] => list.filter((_, i) => i !== index);

  return (
    <>
      <PageMeta
        title="Affiliate Page Content | StudyCafe Admin"
        description="Manage the Studycafe Affiliate Program page — hero, commission slabs, benefits, testimonials and FAQs"
      />
      <PageBreadcrumb pageTitle="Affiliate Page Content" />

      <div className="space-y-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Edits here drive <span className="font-medium">/affiliates</span> on the website. The
          Featured In logos, Founders and Top Selling Courses blocks on that page are fixed and not
          editable from here.
        </p>

        {/* ── Hero ── */}
        <Section title="Hero Banner" description="Top banner of the affiliate page.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Page title (browser / CMS record)</Label>
              <Input
                value={data.pageTitle}
                onChange={(e) => setData((p) => ({ ...p, pageTitle: e.target.value }))}
              />
            </div>
            <div>
              <Label>Badge text</Label>
              <Input
                value={data.hero.badge}
                onChange={(e) => setData((p) => ({ ...p, hero: { ...p.hero, badge: e.target.value } }))}
                placeholder="The Leader in Online Learning"
              />
            </div>
          </div>
          <div>
            <Label>Heading</Label>
            <Input
              value={data.hero.title}
              onChange={(e) => setData((p) => ({ ...p, hero: { ...p.hero, title: e.target.value } }))}
            />
          </div>
          <div>
            <Label>Sub heading</Label>
            <TextArea
              rows={2}
              value={data.hero.subtitle}
              onChange={(v) => setData((p) => ({ ...p, hero: { ...p.hero, subtitle: v } }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Primary button text</Label>
              <Input
                value={data.hero.primaryCta.label}
                onChange={(e) =>
                  setData((p) => ({
                    ...p,
                    hero: { ...p.hero, primaryCta: { ...p.hero.primaryCta, label: e.target.value } },
                  }))
                }
              />
            </div>
            <div>
              <Label>Primary button link</Label>
              <Input
                value={data.hero.primaryCta.href}
                onChange={(e) =>
                  setData((p) => ({
                    ...p,
                    hero: { ...p.hero, primaryCta: { ...p.hero.primaryCta, href: e.target.value } },
                  }))
                }
              />
            </div>
            <div>
              <Label>Secondary button text</Label>
              <Input
                value={data.hero.secondaryCta.label}
                onChange={(e) =>
                  setData((p) => ({
                    ...p,
                    hero: {
                      ...p.hero,
                      secondaryCta: { ...p.hero.secondaryCta, label: e.target.value },
                    },
                  }))
                }
              />
            </div>
            <div>
              <Label>Secondary button link</Label>
              <Input
                value={data.hero.secondaryCta.href}
                onChange={(e) =>
                  setData((p) => ({
                    ...p,
                    hero: {
                      ...p.hero,
                      secondaryCta: { ...p.hero.secondaryCta, href: e.target.value },
                    },
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Highlight tiles</Label>
            {data.hero.highlights.map((h, i) => (
              <Row
                key={i}
                label={`Tile ${i + 1}`}
                canRemove={data.hero.highlights.length > 1}
                onRemove={() =>
                  setData((p) => ({
                    ...p,
                    hero: { ...p.hero, highlights: removeAt(p.hero.highlights, i) },
                  }))
                }
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Value</Label>
                    <Input
                      value={h.value}
                      onChange={(e) => setHighlight(i, { value: e.target.value })}
                      placeholder="Up to 40%"
                    />
                  </div>
                  <div>
                    <Label>Caption</Label>
                    <Input
                      value={h.label}
                      onChange={(e) => setHighlight(i, { label: e.target.value })}
                      placeholder="Commission"
                    />
                  </div>
                </div>
              </Row>
            ))}
            <AddButton
              label="+ Add tile"
              onClick={() =>
                setData((p) => ({
                  ...p,
                  hero: { ...p.hero, highlights: [...p.hero.highlights, { ...EMPTY_HIGHLIGHT }] },
                }))
              }
            />
          </div>
        </Section>

        {/* ── Intro ── */}
        <Section title="Intro" description="Short block right under the banner.">
          <HeadingFields
            title={data.intro.title}
            subtitle={data.intro.subtitle}
            subtitleRows={4}
            onTitle={(v) => setData((p) => ({ ...p, intro: { ...p.intro, title: v } }))}
            onSubtitle={(v) => setData((p) => ({ ...p, intro: { ...p.intro, subtitle: v } }))}
          />
        </Section>

        {/* ── How it works ── */}
        <Section title="How the Program Works">
          <HeadingFields
            title={data.howItWorks.sectionTitle}
            subtitle={data.howItWorks.subtitle}
            onTitle={(v) => setData((p) => ({ ...p, howItWorks: { ...p.howItWorks, sectionTitle: v } }))}
            onSubtitle={(v) => setData((p) => ({ ...p, howItWorks: { ...p.howItWorks, subtitle: v } }))}
          />
          {data.howItWorks.steps.map((s, i) => (
            <Row
              key={i}
              label={`Step ${i + 1}`}
              canRemove={data.howItWorks.steps.length > 1}
              onRemove={() =>
                setData((p) => ({
                  ...p,
                  howItWorks: { ...p.howItWorks, steps: removeAt(p.howItWorks.steps, i) },
                }))
              }
            >
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <Label>Number</Label>
                  <Input value={s.step} onChange={(e) => setStep(i, { step: e.target.value })} placeholder="01" />
                </div>
                <div className="sm:col-span-3">
                  <Label>Title</Label>
                  <Input value={s.title} onChange={(e) => setStep(i, { title: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <TextArea rows={3} value={s.description} onChange={(v) => setStep(i, { description: v })} />
              </div>
            </Row>
          ))}
          <AddButton
            label="+ Add step"
            onClick={() =>
              setData((p) => ({
                ...p,
                howItWorks: { ...p.howItWorks, steps: [...p.howItWorks.steps, { ...EMPTY_STEP }] },
              }))
            }
          />
        </Section>

        {/* ── Benefits ── */}
        <Section title="Why Choose Us" description="Icon cards listing the program's benefits.">
          <HeadingFields
            title={data.benefits.sectionTitle}
            subtitle={data.benefits.subtitle}
            onTitle={(v) => setData((p) => ({ ...p, benefits: { ...p.benefits, sectionTitle: v } }))}
            onSubtitle={(v) => setData((p) => ({ ...p, benefits: { ...p.benefits, subtitle: v } }))}
          />
          {data.benefits.items.map((b, i) => (
            <Row
              key={i}
              label={`Benefit ${i + 1}`}
              canRemove={data.benefits.items.length > 1}
              onRemove={() =>
                setData((p) => ({ ...p, benefits: { ...p.benefits, items: removeAt(p.benefits.items, i) } }))
              }
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Title</Label>
                  <Input value={b.title} onChange={(e) => setBenefit(i, { title: e.target.value })} />
                </div>
                <div>
                  <Label>Icon</Label>
                  {/* Select seeds its state from defaultValue once — re-key it so the
                      value survives the async CMS load and row removals. */}
                  <Select
                    key={`benefit-icon-${i}-${b.icon}`}
                    options={BENEFIT_ICON_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                    defaultValue={b.icon}
                    onChange={(v) => setBenefit(i, { icon: v })}
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <TextArea rows={3} value={b.description} onChange={(v) => setBenefit(i, { description: v })} />
              </div>
            </Row>
          ))}
          <AddButton
            label="+ Add benefit"
            onClick={() =>
              setData((p) => ({
                ...p,
                benefits: { ...p.benefits, items: [...p.benefits.items, { ...EMPTY_BENEFIT }] },
              }))
            }
          />
        </Section>

        {/* ── Commission slabs ── */}
        <Section
          title="Commission Slabs"
          description="Commission rate shown per membership level. Tick 'Highlight' to emphasise a row."
        >
          <HeadingFields
            title={data.commission.sectionTitle}
            subtitle={data.commission.subtitle}
            onTitle={(v) => setData((p) => ({ ...p, commission: { ...p.commission, sectionTitle: v } }))}
            onSubtitle={(v) => setData((p) => ({ ...p, commission: { ...p.commission, subtitle: v } }))}
          />
          <div>
            <Label>Note below the table</Label>
            <Input
              value={data.commission.note}
              onChange={(e) =>
                setData((p) => ({ ...p, commission: { ...p.commission, note: e.target.value } }))
              }
            />
          </div>
          {data.commission.slabs.map((s, i) => (
            <Row
              key={i}
              label={`Slab ${i + 1}`}
              canRemove={data.commission.slabs.length > 1}
              onRemove={() =>
                setData((p) => ({
                  ...p,
                  commission: { ...p.commission, slabs: removeAt(p.commission.slabs, i) },
                }))
              }
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label>Plan name</Label>
                  <Input value={s.plan} onChange={(e) => setSlab(i, { plan: e.target.value })} placeholder="Free Members" />
                </div>
                <div>
                  <Label>Commission</Label>
                  <Input value={s.commission} onChange={(e) => setSlab(i, { commission: e.target.value })} placeholder="20%" />
                </div>
                <div>
                  <Label>Badge (optional)</Label>
                  <Input
                    value={s.badge ?? ""}
                    onChange={(e) => setSlab(i, { badge: e.target.value })}
                    placeholder="Highest payout"
                  />
                </div>
              </div>
              <Checkbox
                label="Highlight this row"
                checked={Boolean(s.highlight)}
                onChange={(checked) => setSlab(i, { highlight: checked })}
              />
            </Row>
          ))}
          <AddButton
            label="+ Add slab"
            onClick={() =>
              setData((p) => ({
                ...p,
                commission: { ...p.commission, slabs: [...p.commission.slabs, { ...EMPTY_SLAB }] },
              }))
            }
          />
        </Section>

        {/* ── What you can promote ── */}
        <Section title="What You Can Promote">
          <HeadingFields
            title={data.promote.sectionTitle}
            subtitle={data.promote.subtitle}
            onTitle={(v) => setData((p) => ({ ...p, promote: { ...p.promote, sectionTitle: v } }))}
            onSubtitle={(v) => setData((p) => ({ ...p, promote: { ...p.promote, subtitle: v } }))}
          />
          {data.promote.cards.map((c, i) => (
            <Row
              key={i}
              label={`Card ${i + 1}`}
              canRemove={data.promote.cards.length > 1}
              onRemove={() =>
                setData((p) => ({ ...p, promote: { ...p.promote, cards: removeAt(p.promote.cards, i) } }))
              }
            >
              <div>
                <Label>Title</Label>
                <Input value={c.title} onChange={(e) => setPromoCard(i, { title: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <TextArea rows={3} value={c.description} onChange={(v) => setPromoCard(i, { description: v })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Link text</Label>
                  <Input value={c.ctaLabel} onChange={(e) => setPromoCard(i, { ctaLabel: e.target.value })} />
                </div>
                <div>
                  <Label>Link URL</Label>
                  <Input value={c.href} onChange={(e) => setPromoCard(i, { href: e.target.value })} />
                </div>
              </div>
            </Row>
          ))}
          <AddButton
            label="+ Add card"
            onClick={() =>
              setData((p) => ({
                ...p,
                promote: { ...p.promote, cards: [...p.promote.cards, { ...EMPTY_PROMO_CARD }] },
              }))
            }
          />
        </Section>

        {/* ── Top earners ── */}
        <Section title="Top Earners" description="Testimonials from affiliate partners.">
          <HeadingFields
            title={data.earners.sectionTitle}
            subtitle={data.earners.subtitle}
            onTitle={(v) => setData((p) => ({ ...p, earners: { ...p.earners, sectionTitle: v } }))}
            onSubtitle={(v) => setData((p) => ({ ...p, earners: { ...p.earners, subtitle: v } }))}
          />
          {data.earners.items.map((e, i) => (
            <Row
              key={i}
              label={`Earner ${i + 1}`}
              canRemove={data.earners.items.length > 1}
              onRemove={() =>
                setData((p) => ({ ...p, earners: { ...p.earners, items: removeAt(p.earners.items, i) } }))
              }
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Name</Label>
                  <Input value={e.name} onChange={(ev) => setEarner(i, { name: ev.target.value })} />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input value={e.role} onChange={(ev) => setEarner(i, { role: ev.target.value })} placeholder="CA Final" />
                </div>
              </div>
              <div>
                <Label>Photo</Label>
                <ImageUpload
                  value={e.image}
                  onChange={(url) => setEarner(i, { image: url })}
                  placeholder={CMS_IMAGE_UPLOAD_PLACEHOLDER}
                />
              </div>
              <div>
                <Label>Testimonial</Label>
                <TextArea rows={5} value={e.quote} onChange={(v) => setEarner(i, { quote: v })} />
              </div>
            </Row>
          ))}
          <AddButton
            label="+ Add earner"
            onClick={() =>
              setData((p) => ({
                ...p,
                earners: { ...p.earners, items: [...p.earners.items, { ...EMPTY_EARNER }] },
              }))
            }
          />
        </Section>

        {/* ── CTA band ── */}
        <Section title="Call-to-Action Band" description="Blue band above the Featured In logos.">
          <div>
            <Label>Heading</Label>
            <Input
              value={data.ctaBand.title}
              onChange={(e) => setData((p) => ({ ...p, ctaBand: { ...p.ctaBand, title: e.target.value } }))}
            />
          </div>
          <div>
            <Label>Sub heading</Label>
            <TextArea
              rows={2}
              value={data.ctaBand.subtitle}
              onChange={(v) => setData((p) => ({ ...p, ctaBand: { ...p.ctaBand, subtitle: v } }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Primary button text</Label>
              <Input
                value={data.ctaBand.primaryCta.label}
                onChange={(e) =>
                  setData((p) => ({
                    ...p,
                    ctaBand: { ...p.ctaBand, primaryCta: { ...p.ctaBand.primaryCta, label: e.target.value } },
                  }))
                }
              />
            </div>
            <div>
              <Label>Primary button link</Label>
              <Input
                value={data.ctaBand.primaryCta.href}
                onChange={(e) =>
                  setData((p) => ({
                    ...p,
                    ctaBand: { ...p.ctaBand, primaryCta: { ...p.ctaBand.primaryCta, href: e.target.value } },
                  }))
                }
              />
            </div>
            <div>
              <Label>Secondary button text</Label>
              <Input
                value={data.ctaBand.secondaryCta.label}
                onChange={(e) =>
                  setData((p) => ({
                    ...p,
                    ctaBand: {
                      ...p.ctaBand,
                      secondaryCta: { ...p.ctaBand.secondaryCta, label: e.target.value },
                    },
                  }))
                }
              />
            </div>
            <div>
              <Label>Secondary button link</Label>
              <Input
                value={data.ctaBand.secondaryCta.href}
                onChange={(e) =>
                  setData((p) => ({
                    ...p,
                    ctaBand: {
                      ...p.ctaBand,
                      secondaryCta: { ...p.ctaBand.secondaryCta, href: e.target.value },
                    },
                  }))
                }
              />
            </div>
          </div>
        </Section>

        {/* ── FAQ ── */}
        <Section title="FAQs" description="Answers accept basic HTML.">
          <HeadingFields
            title={data.faq.sectionTitle}
            subtitle={data.faq.subtitle}
            onTitle={(v) => setData((p) => ({ ...p, faq: { ...p.faq, sectionTitle: v } }))}
            onSubtitle={(v) => setData((p) => ({ ...p, faq: { ...p.faq, subtitle: v } }))}
          />
          {data.faq.items.map((f, i) => (
            <Row
              key={i}
              label={`FAQ ${i + 1}`}
              canRemove={data.faq.items.length > 1}
              onRemove={() => setData((p) => ({ ...p, faq: { ...p.faq, items: removeAt(p.faq.items, i) } }))}
            >
              <div>
                <Label>Question</Label>
                <Input value={f.question} onChange={(e) => setFaqItem(i, { question: e.target.value })} />
              </div>
              <div>
                <Label>Answer</Label>
                <TextArea rows={4} value={f.answer} onChange={(v) => setFaqItem(i, { answer: v })} />
              </div>
            </Row>
          ))}
          <AddButton
            label="+ Add FAQ"
            onClick={() =>
              setData((p) => ({ ...p, faq: { ...p.faq, items: [...p.faq.items, { ...EMPTY_FAQ }] } }))
            }
          />
        </Section>

        {/* ── Contact ── */}
        <Section title="Connect With Us" description="Social icons on the page are fixed.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Section title</Label>
              <Input
                value={data.contact.sectionTitle}
                onChange={(e) =>
                  setData((p) => ({ ...p, contact: { ...p.contact, sectionTitle: e.target.value } }))
                }
              />
            </div>
            <div>
              <Label>Company name</Label>
              <Input
                value={data.contact.companyName}
                onChange={(e) =>
                  setData((p) => ({ ...p, contact: { ...p.contact, companyName: e.target.value } }))
                }
              />
            </div>
          </div>
          <div>
            <Label>Address</Label>
            <TextArea
              rows={3}
              value={data.contact.address}
              onChange={(v) => setData((p) => ({ ...p, contact: { ...p.contact, address: v } }))}
            />
          </div>
        </Section>

        <div className="flex items-center justify-end gap-4">
          {status === "saved" ? (
            <span className="text-sm text-success-600">Saved. Live page refreshes within 10 minutes.</span>
          ) : null}
          {status === "error" ? (
            <span className="text-sm text-error-500">Could not save. Please try again.</span>
          ) : null}
          <Button onClick={handleSave} size="sm" disabled={loading || saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </>
  );
}
