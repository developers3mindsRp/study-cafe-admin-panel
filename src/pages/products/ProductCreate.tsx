import { useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ProductForm, { type ProductFormData } from "./ProductForm";
import { createProduct } from "../../api/products";

export default function ProductCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: ProductFormData) => {
    try {
      setLoading(true);
      await createProduct({
        title: formData.title,
        redirect_url: formData.redirect_url,
        sort_order: formData.sort_order ? Number(formData.sort_order) : 0,
        is_active: formData.is_active,
      });
      navigate("/products");
    } catch (err: any) {
      console.error("Failed to create product", err);
      alert(err.response?.data?.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Create Product | StudyCafe Admin"
        description="Add a product to the Our Products section"
      />
      <PageBreadcrumb pageTitle="Create Product" compact />
      <ProductForm mode="create" onSubmit={handleSubmit} loading={loading} />
    </>
  );
}
