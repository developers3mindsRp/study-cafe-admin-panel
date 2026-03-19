import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import CourseCatForm, { type CourseCatFormData } from "./CourseCatForm";
import { fetchCourseCats, updateCourseCat } from "../../api/courses";

export default function CourseCatEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [defaultValues, setDefaultValues] = useState<Partial<CourseCatFormData> | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchCourseCats().then((cats) => {
      const cat = cats.find((c) => String(c.id) === id);
      if (cat) {
        setDefaultValues({ name: cat.name, slug: cat.slug ?? "", is_featured: cat.is_featured });
      }
    });
  }, [id]);

  const handleSubmit = async (data: CourseCatFormData) => {
    if (!id) return;
    setLoading(true);
    try {
      await updateCourseCat(Number(id), data);
      navigate("/courses/categories");
    } catch (err: unknown) {
      console.error("Failed to update course category", err);
      alert((err as any)?.response?.data?.message || "Failed to update course category");
    } finally {
      setLoading(false);
    }
  };

  if (!defaultValues) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
    );
  }

  return (
    <>
      <PageMeta title="Edit Course Category | StudyCafe Admin" description="Edit course category" />
      <PageBreadcrumb pageTitle="Edit Course Category" />
      <CourseCatForm mode="edit" defaultValues={defaultValues} loading={loading} onSubmit={handleSubmit} />
    </>
  );
}
