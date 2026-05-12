import React from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import BannerForm from "./BannerForm";
import { bannersApi } from "../../api/banners";

export default function BannerCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await bannersApi.create(data);
      navigate("/banners");
    } catch (err: any) {
      console.error("Failed to create banner", err);
      const message = err?.response?.data?.error || err?.response?.data?.message || "Failed to create banner";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Create Banner | StudyCafe Admin" />
      <PageBreadcrumb pageTitle="Create Banner" />
      <div className="mx-auto max-w-4xl">
        <BannerForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </>
  );
}
