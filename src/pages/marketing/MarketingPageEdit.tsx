import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import MarketingPageForm, { type MarketingPageFormData } from "./MarketingPageForm";
import { fetchMarketingPage, updateMarketingPage } from "../../api/marketingPages";

export default function MarketingPageEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [defaults, setDefaults] = useState<Partial<MarketingPageFormData>>();
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchMarketingPage(Number(id))
      .then((row) => {
        setDefaults({
          course_id: String(row.course_id),
          slug: row.slug,
          is_published: row.is_published,
          meta: row.meta ?? {},
        });
      })
      .catch(() => alert("Failed to load marketing page"))
      .finally(() => setFetching(false));
  }, [id]);

  const handleSubmit = async (form: MarketingPageFormData) => {
    if (!id) return;
    try {
      setLoading(true);
      await updateMarketingPage(Number(id), {
        slug: form.slug.trim(),
        is_published: form.is_published,
        meta: form.meta,
      });
      navigate("/marketing-pages");
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed to update marketing page",
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <p className="p-6 text-gray-500">Loading…</p>;

  return (
    <>
      <PageMeta title="Edit Marketing Page | StudyCafe Admin" description="Edit course marketing page" />
      <PageBreadcrumb pageTitle="Edit marketing page" compact />
      {defaults && (
        <MarketingPageForm
          mode="edit"
          defaultValues={defaults}
          loading={loading}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}
