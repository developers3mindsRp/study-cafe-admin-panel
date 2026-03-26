import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import FAQForm, { type FAQFormData } from "./FAQForm";
import { type Faq } from "../../api/faqs";

const mockFAQ: Faq = {
  id: 1,
  question: "How do I access StudyCafe courses?",
  answer:
    "After purchasing a course, you can access it from your dashboard. Log in with your credentials and navigate to the Courses section.",
  sort_order: 1,
};

export default function FAQEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const defaultValues: FAQFormData = {
    question: mockFAQ.question,
    answer: mockFAQ.answer,
    sort_order: String(mockFAQ.sort_order),
  };

  const handleSubmit = (formData: FAQFormData) => {
    // TODO: Integrate with API when backend is ready
    console.log("Update FAQ", id, formData);
    navigate("/faq");
  };

  return (
    <>
      <PageMeta
        title="Edit FAQ | StudyCafe Admin"
        description="Edit FAQ for studycafe.in"
      />
      <PageBreadcrumb
        pageTitle="Edit FAQ"
        compact
      />
      <FAQForm mode="edit" defaultValues={defaultValues} onSubmit={handleSubmit} />
    </>
  );
}
