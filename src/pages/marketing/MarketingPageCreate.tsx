import { useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import MarketingPageForm, { type MarketingPageFormData } from "./MarketingPageForm";
import { createMarketingPage } from "../../api/marketingPages";

export default function MarketingPageCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (form: MarketingPageFormData) => {
    try {
      setLoading(true);
      await createMarketingPage({
        course_id: Number(form.course_id),
        slug: form.slug.trim(),
        is_published: form.is_published,
        meta: form.meta,
      });
      navigate("/marketing-pages");
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed to create marketing page",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Create Marketing Page | StudyCafe Admin" description="New course marketing page" />
      <PageBreadcrumb pageTitle="Create marketing page" compact />
      <MarketingPageForm mode="create" loading={loading} onSubmit={handleSubmit} />
    </>
  );
}
