import { useCallback, useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import ImageUpload from "../../components/form/ImageUpload";
import {
  fetchSiteAdsAdmin,
  putSiteAdsAdmin,
  type SiteDisplayAdsPayload,
  type SiteAdsSlot,
} from "../../api/siteAds";

type TabKey = "popup" | "sidebar" | "between";

const emptySlot = (): SiteAdsSlot => ({ image_url: "", link_url: "" });

export default function DisplayAdsContent() {
  const [tab, setTab] = useState<TabKey>("popup");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [data, setData] = useState<SiteDisplayAdsPayload | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchSiteAdsAdmin()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updatePopup = (patch: Partial<SiteDisplayAdsPayload["popup"]>) => {
    setData((d) => (d ? { ...d, popup: { ...d.popup, ...patch } } : d));
  };

  const updateDetailSide = (index: 0 | 1, patch: Partial<SiteAdsSlot>) => {
    setData((d) => {
      if (!d) return d;
      const next = [...d.article_detail_sidebar] as SiteAdsSlot[];
      next[index] = { ...next[index], ...patch };
      while (next.length < 2) next.push(emptySlot());
      return { ...d, article_detail_sidebar: next.slice(0, 2) };
    });
  };

  const updateListingSide = (patch: Partial<SiteAdsSlot>) => {
    setData((d) => (d ? { ...d, article_listing_sidebar: { ...d.article_listing_sidebar, ...patch } } : d));
  };

  const updateBetween = (
    key: keyof SiteDisplayAdsPayload["between_article"],
    patch: Partial<SiteAdsSlot>,
  ) => {
    setData((d) =>
      d
        ? {
            ...d,
            between_article: { ...d.between_article, [key]: { ...d.between_article[key], ...patch } },
          }
        : d,
    );
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setStatus("idle");
    try {
      const saved = await putSiteAdsAdmin(data);
      setData(saved);
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const detail = data?.article_detail_sidebar ?? [emptySlot(), emptySlot()];

  return (
    <>
      <PageMeta title="Display Ads | Study Cafe Admin" description="Manage site promotional banners" />
      <PageBreadcrumb pageTitle="Display Ads" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        {loading || !data ? (
          <p className="text-gray-600 dark:text-gray-400">Loading…</p>
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row">
            <aside className="flex w-full flex-col gap-2 lg:w-52 lg:shrink-0">
              {(
                [
                  ["popup", "Popup"],
                  ["sidebar", "Sidebar"],
                  ["between", "Between Article"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                    tab === key
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-500/10"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                  }`}
                >
                  {label}
                </button>
              ))}
              <Button className="mt-4 w-full" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Update"}
              </Button>
              {status === "saved" && (
                <p className="text-sm text-green-600 dark:text-green-400">Saved successfully.</p>
              )}
              {status === "error" && (
                <p className="text-sm text-red-600 dark:text-red-400">Could not save. Try again.</p>
              )}
            </aside>

            <div className="min-w-0 flex-1 space-y-6">
              {tab === "popup" && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">First visit popup</h2>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={data.popup.enabled}
                      onChange={(e) => updatePopup({ enabled: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Enable popup for new sessions (once per browser)
                  </label>
                  <div>
                    <Label>Popup Image</Label>
                    <ImageUpload value={data.popup.image_url} onChange={(url) => updatePopup({ image_url: url })} />
                  </div>
                  <div>
                    <Label>Popup Link</Label>
                    <Input
                      type="url"
                      value={data.popup.link_url}
                      onChange={(e) => updatePopup({ link_url: e.target.value })}
                      placeholder="https://"
                    />
                  </div>
                </div>
              )}

              {tab === "sidebar" && (
                <div className="grid gap-8 md:grid-cols-2">
                  {[0, 1].map((i) => (
                    <div key={i} className="space-y-5">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Sidebar ad {i + 1}{" "}
                        <span className="font-normal text-gray-500 dark:text-gray-400">
                          (article detail page — right column)
                        </span>
                      </h2>
                      <div>
                        <Label>Image</Label>
                        <ImageUpload
                          value={detail[i]?.image_url ?? ""}
                          onChange={(url) => updateDetailSide(i as 0 | 1, { image_url: url })}
                        />
                      </div>
                      <div>
                        <Label>{i === 0 ? "Ad link" : "Ad link 2"}</Label>
                        <Input
                          type="url"
                          value={detail[i]?.link_url ?? ""}
                          onChange={(e) => updateDetailSide(i as 0 | 1, { link_url: e.target.value })}
                          placeholder="https://"
                        />
                      </div>
                    </div>
                  ))}
                  <div className="space-y-5 md:col-span-2">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Article listing sidebar
                      <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">
                        (/blogs grid — sticky right column)
                      </span>
                    </h2>
                    <div>
                      <Label>Listing sidebar image</Label>
                      <ImageUpload
                        value={data.article_listing_sidebar.image_url}
                        onChange={(url) => updateListingSide({ image_url: url })}
                      />
                    </div>
                    <div>
                      <Label>Listing sidebar link</Label>
                      <Input
                        type="url"
                        value={data.article_listing_sidebar.link_url}
                        onChange={(e) => updateListingSide({ link_url: e.target.value })}
                        placeholder="https://"
                      />
                    </div>
                  </div>
                </div>
              )}

              {tab === "between" && (
                <div className="space-y-10">
                  <div className="space-y-5">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      After 3rd paragraph
                      <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">
                        (inside article body)
                      </span>
                    </h2>
                    <div>
                      <Label>Banner image</Label>
                      <ImageUpload
                        value={data.between_article.after_paragraph_3.image_url}
                        onChange={(url) => updateBetween("after_paragraph_3", { image_url: url })}
                      />
                    </div>
                    <div>
                      <Label>URL</Label>
                      <Input
                        type="url"
                        value={data.between_article.after_paragraph_3.link_url}
                        onChange={(e) => updateBetween("after_paragraph_3", { link_url: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-5">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      After 6th paragraph
                    </h2>
                    <div>
                      <Label>Banner image</Label>
                      <ImageUpload
                        value={data.between_article.after_paragraph_6.image_url}
                        onChange={(url) => updateBetween("after_paragraph_6", { image_url: url })}
                      />
                    </div>
                    <div>
                      <Label>URL</Label>
                      <Input
                        type="url"
                        value={data.between_article.after_paragraph_6.link_url}
                        onChange={(e) => updateBetween("after_paragraph_6", { link_url: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-5">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Below featured / hero area
                      <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">
                        (shown on blog index under search banner)
                      </span>
                    </h2>
                    <div>
                      <Label>Banner image</Label>
                      <ImageUpload
                        value={data.between_article.below_featured_post.image_url}
                        onChange={(url) => updateBetween("below_featured_post", { image_url: url })}
                      />
                    </div>
                    <div>
                      <Label>URL</Label>
                      <Input
                        type="url"
                        value={data.between_article.below_featured_post.link_url}
                        onChange={(e) => updateBetween("below_featured_post", { link_url: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
