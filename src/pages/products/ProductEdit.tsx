import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ProductForm, { type ProductFormData } from "./ProductForm";
import { fetchProduct, updateProduct, type Product } from "../../api/products";

export default function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Product | null>(null);

  useEffect(() => {
    if (id) loadItem(Number(id));
  }, [id]);

  const loadItem = async (itemId: number) => {
    try {
      setLoading(true);
      setData(await fetchProduct(itemId));
    } catch (err) {
      console.error("Failed to load product", err);
      alert("Failed to load product or it does not exist.");
      navigate("/products");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: ProductFormData) => {
    if (!id) return;
    try {
      setSaving(true);
      await updateProduct(Number(id), {
        title: formData.title,
        redirect_url: formData.redirect_url,
        sort_order: formData.sort_order ? Number(formData.sort_order) : 0,
        is_active: formData.is_active,
      });
      alert("Product updated successfully!");
      navigate(`/products/${id}/edit`);
    } catch (err: any) {
      console.error("Failed to update product", err);
      alert(err.response?.data?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center p-20">
        <p className="text-gray-500">Loading product...</p>
      </div>
    );
  }

  const defaultValues: ProductFormData = {
    title: data.title || "",
    redirect_url: data.redirect_url || "",
    sort_order: String(data.sort_order),
    is_active: data.is_active,
  };

  return (
    <>
      <PageMeta title="Edit Product | StudyCafe Admin" description="Edit product" />
      <PageBreadcrumb pageTitle="Edit Product" compact />
      <ProductForm
        mode="edit"
        defaultValues={defaultValues}
        loading={saving}
        onSubmit={handleSubmit}
      />
    </>
  );
}
