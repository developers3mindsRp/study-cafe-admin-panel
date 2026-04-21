import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import RichTextEditor from "../../components/form/RichTextEditor";
import Select from "../../components/form/Select";
import {
  fetchNewsletterTemplates,
  sendNewsletter,
  type NewsletterTemplate,
  type SendNewsletterResult,
} from "../../api/newsletter";

type AudienceMode = "all" | "custom";

export default function SendNewsletter() {
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templateId, setTemplateId] = useState<string>("");
  const [customSubject, setCustomSubject] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [audience, setAudience] = useState<AudienceMode>("all");
  const [customEmails, setCustomEmails] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendNewsletterResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchNewsletterTemplates();
        if (!cancelled) setTemplates(list);
      } catch (err) {
        console.error("Failed to load templates", err);
      } finally {
        if (!cancelled) setLoadingTemplates(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedTemplate = templates.find((t) => String(t.id) === templateId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateId) {
      alert("Please select a template.");
      return;
    }

    let send_to: "all" | string[] = "all";
    if (audience === "custom") {
      const emails = customEmails
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (emails.length === 0) {
        alert("Please enter at least one email, separated by commas or new lines.");
        return;
      }
      send_to = emails;
    }

    const confirmMsg =
      audience === "all"
        ? "Send this newsletter to ALL verified subscribers?"
        : `Send this newsletter to ${(send_to as string[]).length} email(s)?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setSending(true);
      setResult(null);
      const res = await sendNewsletter({
        template_id: Number(templateId),
        custom_subject: customSubject.trim() || undefined,
        custom_content: customContent.trim() || undefined,
        send_to,
      });
      setResult(res);
    } catch (err: any) {
      console.error("Failed to send newsletter", err);
      alert(err.response?.data?.message || "Failed to send newsletter");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Send Newsletter | StudyCafe Admin"
        description="Send a newsletter to subscribers"
      />
      <PageBreadcrumb pageTitle="Send Newsletter" />

      <form onSubmit={handleSend} className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="space-y-4">
            <div>
              <Label>Template <span className="text-error-500">*</span></Label>
              {loadingTemplates ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading templates…</p>
              ) : templates.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No templates yet. Create one first.
                </p>
              ) : (
                <Select
                  options={templates.map((t) => ({ value: String(t.id), label: t.name }))}
                  onChange={(v) => setTemplateId(v)}
                  placeholder="Select a template"
                />
              )}
              {selectedTemplate && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Default subject: <span className="font-medium">{selectedTemplate.subject}</span>
                </p>
              )}
            </div>

            <div>
              <Label>Audience</Label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="audience"
                    value="all"
                    checked={audience === "all"}
                    onChange={() => setAudience("all")}
                  />
                  All verified subscribers
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="audience"
                    value="custom"
                    checked={audience === "custom"}
                    onChange={() => setAudience("custom")}
                  />
                  Specific emails
                </label>
              </div>
            </div>

            {audience === "custom" && (
              <div>
                <Label>Emails (comma or newline separated)</Label>
                <textarea
                  value={customEmails}
                  onChange={(e) => setCustomEmails(e.target.value)}
                  rows={4}
                  placeholder="one@example.com, two@example.com"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
            )}

            <div>
              <Label>Custom Subject (optional override)</Label>
              <Input
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Leave blank to use template subject"
              />
            </div>

            <div>
              <Label>Custom Content (optional override)</Label>
              <RichTextEditor
                value={customContent}
                onChange={setCustomContent}
                placeholder="Leave blank to use template content"
                minHeight="240px"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={sending || templates.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Sending…" : "Send Newsletter"}
          </button>
        </div>

        {result && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="mb-3 text-base font-semibold text-gray-800 dark:text-white/90">Send Result</h3>
            <dl className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Recipients</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">{result.recipients_count}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Sent</dt>
                <dd className="mt-1 text-lg font-semibold text-success-600 dark:text-success-400">{result.sent_count}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Failed</dt>
                <dd className="mt-1 text-lg font-semibold text-error-500 dark:text-error-400">{result.failed_count}</dd>
              </div>
            </dl>
          </div>
        )}
      </form>
    </>
  );
}
