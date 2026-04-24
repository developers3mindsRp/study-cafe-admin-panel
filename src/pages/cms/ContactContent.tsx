import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import RichTextEditor from "../../components/form/RichTextEditor";
import Button from "../../components/ui/button/Button";
import { fetchCmsPageBySlug, updateCmsPage } from "../../api/cmsPages";
import {
  CONTACT_PAGE_DEFAULTS,
  contactFormStateFromCms,
  buildContactMeta,
  type ContactPageFormState,
} from "../../types/contactPageContent";

const SLUG = "contact";

export default function ContactContent() {
  const [content, setContent] = useState<ContactPageFormState>({ ...CONTACT_PAGE_DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    fetchCmsPageBySlug(SLUG)
      .then((data) => {
        if (cancelled) return;
        setContent(contactFormStateFromCms(data));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const set = <K extends keyof ContactPageFormState>(key: K, value: ContactPageFormState[K]) => {
    setStatus("idle");
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setSaving(true);
    setStatus("idle");
    updateCmsPage(SLUG, {
      title: content.title,
      content: content.description,
      meta: buildContactMeta(content),
    })
      .then(() => {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 4000);
      })
      .catch(() => {
        setStatus("error");
      })
      .finally(() => {
        setSaving(false);
      });
  };

  return (
    <>
      <PageMeta
        title="Contact Page Content | StudyCafe Admin"
        description="Update Contact page content for studycafe.in"
      />
      <PageBreadcrumb pageTitle="Contact Page Content" />
      <div className="space-y-6">
        {status === "saved" && (
          <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
            Changes saved. They will appear on the public site after the next revalidation (or within a few minutes).
          </p>
        )}
        {status === "error" && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            Save failed. Check your network and try again.
          </p>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Hero & form</h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Main title, copy, and form button label shown on studycafe.in/contact-us</p>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Page title (browser / SEO uses SEO settings too)</Label>
                <Input
                  value={content.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Contact Us"
                />
              </div>
              <div>
                <Label>Main heading</Label>
                <Input value={content.heading} onChange={(e) => set("heading", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Description (HTML)</Label>
              <RichTextEditor
                value={content.description}
                onChange={(v) => set("description", v)}
                minHeight="120px"
              />
            </div>
            <div>
              <Label>Form column heading</Label>
              <Input value={content.formHeading} onChange={(e) => set("formHeading", e.target.value)} />
            </div>
            <div>
              <Label>Submit button text</Label>
              <Input
                value={content.submitButtonText}
                onChange={(e) => set("submitButtonText", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Primary contact (cards)</h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Top row: email, phone, office</p>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Email (address)</Label>
                <Input type="email" value={content.email} onChange={(e) => set("email", e.target.value)} />
              </div>
              <div>
                <Label>Phone (display)</Label>
                <Input value={content.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Office address (multiline)</Label>
              <TextArea
                rows={3}
                value={content.address}
                onChange={(v) => set("address", v)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Email card title</Label>
                <Input value={content.emailCardTitle} onChange={(e) => set("emailCardTitle", e.target.value)} />
              </div>
              <div>
                <Label>Phone card title</Label>
                <Input value={content.phoneCardTitle} onChange={(e) => set("phoneCardTitle", e.target.value)} />
              </div>
              <div>
                <Label>Office card title</Label>
                <Input value={content.officeCardTitle} onChange={(e) => set("officeCardTitle", e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Working hours (card)</h3>
          <div className="mt-4 space-y-4">
            <div>
              <Label>Card title</Label>
              <Input
                value={content.workingHoursTitle}
                onChange={(e) => set("workingHoursTitle", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Line 1</Label>
                <Input
                  value={content.workingHoursLine1}
                  onChange={(e) => set("workingHoursLine1", e.target.value)}
                />
              </div>
              <div>
                <Label>Line 2</Label>
                <Input
                  value={content.workingHoursLine2}
                  onChange={(e) => set("workingHoursLine2", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Team contact boxes</h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Marketing and accounts CTA blocks</p>
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
              <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Marketing</p>
              <div className="space-y-3">
                <div>
                  <Label>Intro line</Label>
                  <TextArea
                    rows={2}
                    value={content.marketingBlurb}
                    onChange={(v) => set("marketingBlurb", v)}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={content.marketingEmail}
                    onChange={(e) => set("marketingEmail", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Button text</Label>
                  <Input value={content.marketingCta} onChange={(e) => set("marketingCta", e.target.value)} />
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
              <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Accounts</p>
              <div className="space-y-3">
                <div>
                  <Label>Intro line</Label>
                  <TextArea
                    rows={2}
                    value={content.accountsBlurb}
                    onChange={(v) => set("accountsBlurb", v)}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={content.accountsEmail}
                    onChange={(e) => set("accountsEmail", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Button text</Label>
                  <Input value={content.accountsCta} onChange={(e) => set("accountsCta", e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Follow us</h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Full URLs; leave blank to hide an icon on the public site</p>
          <div className="space-y-4">
            <div>
              <Label>Section title</Label>
              <Input value={content.followTitle} onChange={(e) => set("followTitle", e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <TextArea
                rows={2}
                value={content.followDescription}
                onChange={(v) => set("followDescription", v)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["socialLinkedin", "LinkedIn URL"],
                  ["socialX", "X (Twitter) URL"],
                  ["socialInstagram", "Instagram URL"],
                  ["socialFacebook", "Facebook URL"],
                  ["socialTelegram", "Telegram URL"],
                  ["socialYoutube", "YouTube URL"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Input
                    type="url"
                    value={content[key]}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder="https://"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Map section</h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">The embedded map still searches using the office address from above</p>
          <div className="space-y-4">
            <div>
              <Label>Section heading</Label>
              <Input value={content.mapTitle} onChange={(e) => set("mapTitle", e.target.value)} />
            </div>
            <div>
              <Label>Intro text</Label>
              <TextArea
                rows={2}
                value={content.mapDescription}
                onChange={(v) => set("mapDescription", v)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} size="sm" disabled={loading || saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </>
  );
}
