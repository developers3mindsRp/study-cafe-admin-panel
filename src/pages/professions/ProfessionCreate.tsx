import { useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ProfessionForm, { type ProfessionFormData } from "./ProfessionForm";
import { createProfession } from "../../api/professions";
import { getApiErrorMessage } from "../../lib/apiError";

export default function ProfessionCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: ProfessionFormData) => {
    try {
      setLoading(true);
      await createProfession(formData);
      navigate("/professions");
    } catch (err: unknown) {
      console.error("Failed to create profession", err);
      alert(getApiErrorMessage(err, "Failed to create profession"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Create Profession | StudyCafe Admin"
        description="Add a new profession option"
      />
      <PageBreadcrumb
        pageTitle="Create Profession"
        items={[{ label: "Professions", path: "/professions" }]}
      />
      <ProfessionForm mode="create" loading={loading} onSubmit={handleSubmit} />
    </>
  );
}
