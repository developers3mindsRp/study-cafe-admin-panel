import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import CertificateLinkForm from "./CertificateLinkForm";
import type { CertificateLink, CertificateLinkFormValues } from "../../types/certificateLink";
import { fetchCertificateLink, updateCertificateLink } from "../../api/certificateLinks";
import { getApiErrorMessage } from "../../lib/apiError";

export default function CertificateLinkEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<CertificateLink | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setData(await fetchCertificateLink(id));
      } catch {
        alert("Failed to load certificate link");
        navigate("/certificate-links");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const defaultValues = useMemo<CertificateLinkFormValues | undefined>(() => {
    if (!data) return undefined;
    return {
      course_id: String(data.course_id ?? ""),
      title: data.title ?? "",
      description: data.description ?? "",
      status: data.status,
      expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : "",
      // The API returns a date-only string; guard against a full datetime just in case.
      certificate_date: data.certificate_date ? String(data.certificate_date).slice(0, 10) : "",
      max_claims: data.max_claims != null ? String(data.max_claims) : "",
      send_email: data.send_email !== false,
    };
  }, [data]);

  const handleSubmit = async (form: CertificateLinkFormValues) => {
    if (!id) return;
    try {
      setSaving(true);
      await updateCertificateLink(id, {
        // Omitted when locked by issued certificates — the API rejects the change anyway.
        ...(Number(data?.claims_count ?? 0) > 0 ? {} : { course_id: Number(form.course_id) }),
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        expires_at: form.expires_at,
        certificate_date: form.certificate_date || null,
        max_claims: form.max_claims.trim() ? Number(form.max_claims) : null,
        send_email: form.send_email,
      });
      alert("Certificate link updated successfully!");
      navigate("/certificate-links");
    } catch (err: unknown) {
      alert(getApiErrorMessage(err, "Failed to update certificate link"));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data || !defaultValues) {
    return (
      <div className="flex items-center justify-center p-20">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Edit Certificate Link | StudyCafe Admin"
        description="Edit a public certificate download link"
      />
      <PageBreadcrumb
        pageTitle="Edit Certificate Link"
        compact
        actions={
          <Link
            to={`/certificate-links/${id}/claims`}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
          >
            View leads ({data.claims_count})
          </Link>
        }
      />
      <CertificateLinkForm
        mode="edit"
        defaultValues={defaultValues}
        claimsCount={Number(data.claims_count ?? 0)}
        onSubmit={handleSubmit}
        loading={saving}
      />
    </>
  );
}
