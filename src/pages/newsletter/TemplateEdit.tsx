import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import TemplateForm, { type TemplateFormData } from "./TemplateForm";
import {
  fetchNewsletterTemplates,
  updateNewsletterTemplate,
  type NewsletterTemplate,
} from "../../api/newsletter";

export default function TemplateEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [template, setTemplate] = useState<NewsletterTemplate | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await fetchNewsletterTemplates();
        const found = all.find((t) => String(t.id) === String(id)) || null;
        if (!cancelled) {
          setTemplate(found);
          setInitialLoading(false);
        }
      } catch (err) {
        console.error("Failed to load template", err);
        if (!cancelled) setInitialLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmit = async (formData: TemplateFormData) => {
    if (!id) return;
    try {
      setLoading(true);
      await updateNewsletterTemplate(Number(id), {
        name: formData.name,
        subject: formData.subject,
        html_content: formData.html_content,
      });
      navigate("/newsletter/templates");
    } catch (err: any) {
      console.error("Failed to update template", err);
      alert(err.response?.data?.message || "Failed to update template");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">Loading…</div>
    );
  }

  if (!template) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        Template not found.
      </div>
    );
  }

  const defaultValues: TemplateFormData = {
    name: template.name,
    subject: template.subject,
    html_content: template.html_content,
  };

  return (
    <>
      <PageMeta
        title="Edit Newsletter Template | StudyCafe Admin"
        description="Edit newsletter template"
      />
      <PageBreadcrumb pageTitle="Edit Template" compact />
      <TemplateForm
        mode="edit"
        defaultValues={defaultValues}
        loading={loading}
        onSubmit={handleSubmit}
      />
    </>
  );
}
