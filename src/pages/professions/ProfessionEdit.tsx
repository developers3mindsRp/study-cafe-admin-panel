import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ProfessionForm, { type ProfessionFormData } from "./ProfessionForm";
import { fetchProfession, updateProfession, type Profession } from "../../api/professions";
import { getApiErrorMessage } from "../../lib/apiError";

export default function ProfessionEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profession, setProfession] = useState<Profession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchProfession(Number(id))
      .then(setProfession)
      .catch(() => navigate("/professions"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSubmit = async (formData: ProfessionFormData) => {
    if (!id) return;
    try {
      setSubmitting(true);
      await updateProfession(Number(id), formData);
      alert("Profession updated successfully!");
      navigate(`/professions/${id}/edit`);
    } catch (err: unknown) {
      console.error("Failed to update profession", err);
      alert(getApiErrorMessage(err, "Failed to update profession"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !profession) return <div className="p-6 text-center">Loading…</div>;

  return (
    <>
      <PageMeta
        title="Edit Profession | StudyCafe Admin"
        description="Edit profession option"
      />
      <PageBreadcrumb
        pageTitle="Edit Profession"
        items={[{ label: "Professions", path: "/professions" }]}
      />
      <ProfessionForm
        mode="edit"
        defaultValues={{ title: profession.title, status: profession.status }}
        loading={submitting}
        onSubmit={handleSubmit}
      />
    </>
  );
}
