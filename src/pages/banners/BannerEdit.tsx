import React from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import BannerForm from "./BannerForm";
import { bannersApi, type BannerRecord } from "../../api/banners";

export default function BannerEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [fetching, setFetching] = React.useState(true);
  const [banner, setBanner] = React.useState<BannerRecord | null>(null);

  React.useEffect(() => {
    const fetchBanner = async () => {
      try {
        const data = await bannersApi.get(Number(id));
        setBanner(data);
      } catch (err) {
        console.error("Failed to fetch banner", err);
        alert("Failed to fetch banner details");
        navigate("/banners");
      } finally {
        setFetching(false);
      }
    };
    fetchBanner();
  }, [id, navigate]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await bannersApi.update(Number(id), data);
      navigate("/banners");
    } catch (err: any) {
      console.error("Failed to update banner", err);
      const message = err?.response?.data?.error || err?.response?.data?.message || "Failed to update banner";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-10 text-center">Loading banner...</div>;

  return (
    <>
      <PageMeta title="Edit Banner | StudyCafe Admin" description="Edit banner content and placement" />
      <PageBreadcrumb pageTitle="Edit Banner" />
      <div className="mx-auto max-w-4xl">
        <BannerForm initialData={banner || undefined} onSubmit={handleSubmit} loading={loading} />
      </div>
    </>
  );
}
