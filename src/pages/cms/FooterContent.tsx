import { useCallback, useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import Button from "../../components/ui/button/Button";
import { TrashBinIcon } from "../../icons";
import { fetchFooterAdmin, FOOTER_KEYS, putFooterKey, type FooterDataRow } from "../../api/footer";

type SocialState = {
  twitter: string;
  instagram: string;
  linkedin: string;
  facebook: string;
  youtube: string;
  telegram: string;
};

type AppLinksState = {
  googlePlay: string;
  appStore: string;
};

type ImportantLink = {
  title: string;
  url: string;
  column: 1 | 2;
};

const EMPTY_SOCIAL: SocialState = {
  twitter: "",
  instagram: "",
  linkedin: "",
  facebook: "",
  youtube: "",
  telegram: "",
};

function parseSocialJson(raw: string | null | undefined): SocialState {
  const base = { ...EMPTY_SOCIAL };
  if (!raw) return base;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (!o || typeof o !== "object") return base;
    (Object.keys(base) as (keyof SocialState)[]).forEach((k) => {
      if (typeof o[k] === "string") base[k] = o[k];
    });
    return base;
  } catch {
    return base;
  }
}

function parseAppLinks(raw: string | null | undefined): AppLinksState {
  const base = { googlePlay: "", appStore: "" };
  if (!raw) return base;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    return {
      googlePlay: typeof o.googlePlay === "string" ? o.googlePlay : "",
      appStore: typeof o.appStore === "string" ? o.appStore : "",
    };
  } catch {
    return base;
  }
}

function parseImportantLinks(raw: string | null | undefined): ImportantLink[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.map((item) => ({
      title: item && typeof item === "object" && typeof (item as { title?: unknown }).title === "string" ? (item as { title: string }).title : "",
      url: item && typeof item === "object" && typeof (item as { url?: unknown }).url === "string" ? (item as { url: string }).url : "",
      column: item && typeof item === "object" && (item as { column?: unknown }).column === 2 ? 2 : 1,
    }));
  } catch {
    return [];
  }
}

function stateFromRows(rows: FooterDataRow[]) {
  const map = new Map(rows.map((r) => [r.data_key, r.data_value]));
  return {
    copyright: map.get(FOOTER_KEYS.copyright) ?? "",
    tagline: map.get(FOOTER_KEYS.tagline) ?? "",
    social: parseSocialJson(map.get(FOOTER_KEYS.social_links) ?? null),
    appLinks: parseAppLinks(map.get(FOOTER_KEYS.app_links) ?? null),
    importantLinks: parseImportantLinks(map.get(FOOTER_KEYS.important_links) ?? null),
  };
}

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

export default function FooterContent() {
  const [copyright, setCopyright] = useState("");
  const [tagline, setTagline] = useState("");
  const [social, setSocial] = useState<SocialState>({ ...EMPTY_SOCIAL });
  const [appLinks, setAppLinks] = useState<AppLinksState>({ googlePlay: "", appStore: "" });
  const [importantLinks, setImportantLinks] = useState<ImportantLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const load = useCallback(() => {
    setLoading(true);
    fetchFooterAdmin()
      .then((rows) => {
        const s = stateFromRows(rows);
        setCopyright(s.copyright);
        setTagline(s.tagline);
        setSocial(s.social);
        setAppLinks(s.appLinks);
        setImportantLinks(s.importantLinks.length ? s.importantLinks : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setSocialField = (key: keyof SocialState, value: string) => {
    setStatus("idle");
    setSocial((prev) => ({ ...prev, [key]: value }));
  };

  const updateImportantLink = (index: number, patch: Partial<ImportantLink>) => {
    setStatus("idle");
    setImportantLinks((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeImportantLink = (index: number) => {
    setStatus("idle");
    setImportantLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const addImportantLink = () => {
    setStatus("idle");
    setImportantLinks((prev) => [...prev, { title: "", url: "", column: 1 }]);
  };

  const handleSave = () => {
    setSaving(true);
    setStatus("idle");
    Promise.all([
      putFooterKey(FOOTER_KEYS.copyright, { data_value: copyright }),
      putFooterKey(FOOTER_KEYS.tagline, { data_value: tagline }),
      putFooterKey(FOOTER_KEYS.social_links, { data_value: social }),
      putFooterKey(FOOTER_KEYS.app_links, { data_value: appLinks }),
      putFooterKey(FOOTER_KEYS.important_links, { data_value: importantLinks }),
    ])
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
      <PageMeta title="Footer | StudyCafe Admin" description="Edit site footer content for studycafe.in" />
      <PageBreadcrumb pageTitle="Footer" />
      <div className="space-y-6">
        {status === "saved" && (
          <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
            Changes saved. The public site reads them from GET /platform/footer.
          </p>
        )}
        {status === "error" && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            Save failed. Check your network and try again.
          </p>
        )}

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : (
          <>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
              <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Copyright &amp; tagline</h3>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Plain text shown in the footer. Useful Links stay hardcoded on the public site.
              </p>
              <div className="space-y-4">
                <div>
                  <Label>Copyright line</Label>
                  <TextArea
                    value={copyright}
                    onChange={(v) => {
                      setStatus("idle");
                      setCopyright(v);
                    }}
                    rows={2}
                    placeholder="Copyright © 2026 StudyCafe Private Limited. All Rights Reserved."
                  />
                </div>
                <div>
                  <Label>Tagline (under logo)</Label>
                  <TextArea
                    value={tagline}
                    onChange={(v) => {
                      setStatus("idle");
                      setTagline(v);
                    }}
                    rows={2}
                    placeholder="Empowering learners with quality education and professional courses."
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
              <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Social links</h3>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">URLs only; icon set is fixed on the website.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["twitter", "X (Twitter)"],
                    ["instagram", "Instagram"],
                    ["linkedin", "LinkedIn"],
                    ["facebook", "Facebook"],
                    ["youtube", "YouTube"],
                    ["telegram", "Telegram"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Input
                      type="url"
                      value={social[key]}
                      onChange={(e) => setSocialField(key, e.target.value)}
                      placeholder="https://"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
              <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">App stores</h3>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Google Play and App Store URLs for badge buttons.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Google Play</Label>
                  <Input
                    type="url"
                    value={appLinks.googlePlay}
                    onChange={(e) => {
                      setStatus("idle");
                      setAppLinks((p) => ({ ...p, googlePlay: e.target.value }));
                    }}
                    placeholder="https://play.google.com/..."
                  />
                </div>
                <div>
                  <Label>App Store</Label>
                  <Input
                    type="url"
                    value={appLinks.appStore}
                    onChange={(e) => {
                      setStatus("idle");
                      setAppLinks((p) => ({ ...p, appStore: e.target.value }));
                    }}
                    placeholder="https://apps.apple.com/..."
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Important links</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Two columns on the site; choose column per row.</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addImportantLink}>
                  Add link
                </Button>
              </div>
              {importantLinks.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No links yet. Click &quot;Add link&quot;.</p>
              ) : (
                <div className="space-y-3">
                  {importantLinks.map((row, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 dark:border-gray-800 sm:flex-row sm:items-end"
                    >
                      <div className="min-w-0 flex-1">
                        <Label>Title</Label>
                        <Input
                          value={row.title}
                          onChange={(e) => updateImportantLink(index, { title: e.target.value })}
                          placeholder="Link label"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Label>URL</Label>
                        <Input
                          type="url"
                          value={row.url}
                          onChange={(e) => updateImportantLink(index, { url: e.target.value })}
                          placeholder="https:// or /path"
                        />
                      </div>
                      <div className="w-full sm:w-40">
                        <Label>Column</Label>
                        <select
                          className={selectClass}
                          value={row.column}
                          onChange={(e) =>
                            updateImportantLink(index, { column: e.target.value === "2" ? 2 : 1 })
                          }
                        >
                          <option value={1}>Column 1</option>
                          <option value={2}>Column 2</option>
                        </select>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="shrink-0 text-red-600 dark:text-red-400"
                        onClick={() => removeImportantLink(index)}
                        aria-label="Remove link"
                      >
                        <TrashBinIcon className="size-4 fill-current" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save footer"}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
