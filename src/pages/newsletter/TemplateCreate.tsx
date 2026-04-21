import { useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import TemplateForm, { type TemplateFormData } from "./TemplateForm";
import { createNewsletterTemplate } from "../../api/newsletter";

export default function TemplateCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: TemplateFormData) => {
    try {
      setLoading(true);
      await createNewsletterTemplate({
        name: formData.name,
        subject: formData.subject,
        html_content: formData.html_content,
      });
      navigate("/newsletter/templates");
    } catch (err: any) {
      console.error("Failed to create template", err);
      alert(err.response?.data?.message || "Failed to create template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Create Newsletter Template | StudyCafe Admin"
        description="Add a new newsletter template"
      />
      <PageBreadcrumb pageTitle="Create Template" compact />
      <TemplateForm mode="create" loading={loading} onSubmit={handleSubmit} />
    </>
  );
}
