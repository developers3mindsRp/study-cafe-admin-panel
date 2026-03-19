import { useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import CourseCatForm, { type CourseCatFormData } from "./CourseCatForm";
import { createCourseCat } from "../../api/courses";

export default function CourseCatCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CourseCatFormData) => {
    setLoading(true);
    try {
      await createCourseCat(data);
      navigate("/courses/categories");
    } catch (err: unknown) {
      console.error("Failed to create course category", err);
      alert((err as any)?.response?.data?.message || "Failed to create course category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Add Course Category | StudyCafe Admin" description="Create a new course category" />
      <PageBreadcrumb pageTitle="Add Course Category" />
      <CourseCatForm mode="create" loading={loading} onSubmit={handleSubmit} />
    </>
  );
}
