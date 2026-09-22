import { useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import CertificateLinkForm from "./CertificateLinkForm";
import type { CertificateLinkFormValues } from "../../types/certificateLink";
import { createCertificateLink } from "../../api/certificateLinks";
import { getApiErrorMessage } from "../../lib/apiError";

export default function CertificateLinkCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (form: CertificateLinkFormValues) => {
    try {
      setLoading(true);
      await createCertificateLink({
        course_id: Number(form.course_id),
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        expires_at: form.expires_at,
        certificate_date: form.certificate_date || null,
        max_claims: form.max_claims.trim() ? Number(form.max_claims) : null,
        send_email: form.send_email,
      });
      navigate("/certificate-links");
    } catch (err: unknown) {
      console.error(err);
      alert(getApiErrorMessage(err, "Failed to create certificate link"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Create Certificate Link | StudyCafe Admin"
        description="Create a public certificate download link"
      />
      <PageBreadcrumb pageTitle="Create Certificate Link" compact />
      <CertificateLinkForm mode="create" onSubmit={handleSubmit} loading={loading} />
    </>
  );
}
