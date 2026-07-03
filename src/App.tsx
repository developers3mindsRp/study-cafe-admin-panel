import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
  Outlet,
  Navigate,
} from "react-router";
import SignIn from "./pages/auth-pages/SignIn";
import SignUp from "./pages/auth-pages/SignUp";
import NotFound from "./pages/other-page/NotFound";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RedirectIfAuthenticated } from "./components/auth/RedirectIfAuthenticated";
import { RequirePermissionRoute } from "./components/auth/RequirePermission";
import Videos from "./components/ui/demo/Videos";
import Images from "./components/ui/demo/Images";
import Alerts from "./components/ui/demo/Alerts";
import Badges from "./components/ui/demo/Badges";
import Avatars from "./components/ui/demo/Avatars";
import Buttons from "./components/ui/demo/Buttons";
import LineChart from "./components/charts/LineChart";
import BarChart from "./components/charts/BarChart";
import BasicTablesPage from "./components/tables/BasicTablesPage";
import FormElements from "./components/form/FormElements";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/dashboard/Home";
import HomeContent from "./pages/cms/HomeContent";
import AboutContent from "./pages/cms/AboutContent";
import ContactContent from "./pages/cms/ContactContent";
import PrivacyPolicyContent from "./pages/cms/PrivacyPolicyContent";
import EthicsPolicyContent from "./pages/cms/EthicsPolicyContent";
import TermsOfUseContent from "./pages/cms/TermsOfUseContent";
import DisclaimerContent from "./pages/cms/DisclaimerContent";
import RefundPolicyContent from "./pages/cms/RefundPolicyContent";
import FooterContent from "./pages/cms/FooterContent";
import DisplayAdsContent from "./pages/cms/DisplayAdsContent";
import SEOMetadataList from "./pages/seo/SEOMetadataList";
import SEOMetadataCreate from "./pages/seo/SEOMetadataCreate";
import SEOMetadataEdit from "./pages/seo/SEOMetadataEdit";
import SEOMetadataView from "./pages/seo/SEOMetadataView";
import SiteSeoRoutesPage from "./pages/seo/SiteSeoRoutesPage";
import ArticleList from "./pages/articles/ArticleList";
import ArticleCreate from "./pages/articles/ArticleCreate";
import ArticleEdit from "./pages/articles/ArticleEdit";
import ArticleView from "./pages/articles/ArticleView";
import ArticlePreview from "./pages/articles/ArticlePreview";
import CategoryList from "./pages/categories/CategoryList";
import CategoryCreate from "./pages/categories/CategoryCreate";
import CategoryEdit from "./pages/categories/CategoryEdit";
import ArticleMastersPage from "./pages/article-masters/ArticleMastersPage";
import MasterTermCreate from "./pages/article-masters/MasterTermCreate";
import MasterTermEdit from "./pages/article-masters/MasterTermEdit";
import MembershipList from "./pages/memberships/MembershipList";
import MembershipCreate from "./pages/memberships/MembershipCreate";
import MembershipEdit from "./pages/memberships/MembershipEdit";
import MembershipView from "./pages/memberships/MembershipView";
import ComparisonFeatures from "./pages/memberships/ComparisonFeatures";
import GoogleReviewList from "./pages/google-reviews/TestimonialList";
import GoogleReviewCreate from "./pages/google-reviews/TestimonialCreate";
import GoogleReviewEdit from "./pages/google-reviews/TestimonialEdit";
import GoogleReviewView from "./pages/google-reviews/TestimonialView";
import TestimonialList from "./pages/testimonials/TestimonialList";
import TestimonialCreate from "./pages/testimonials/TestimonialCreate";
import TestimonialEdit from "./pages/testimonials/TestimonialEdit";
import MarketingPageList from "./pages/marketing/MarketingPageList";
import MarketingPageCreate from "./pages/marketing/MarketingPageCreate";
import MarketingPageEdit from "./pages/marketing/MarketingPageEdit";
import MarketingPageView from "./pages/marketing/MarketingPageView";
import FAQList from "./pages/faq/FAQList";
import FAQCreate from "./pages/faq/FAQCreate";
import FAQEdit from "./pages/faq/FAQEdit";
import FAQView from "./pages/faq/FAQView";
import SubscribersList from "./pages/newsletter/SubscribersList";
import TemplatesList from "./pages/newsletter/TemplatesList";
import TemplateCreate from "./pages/newsletter/TemplateCreate";
import TemplateEdit from "./pages/newsletter/TemplateEdit";
import SendNewsletter from "./pages/newsletter/SendNewsletter";
import AdminUserList from "./pages/admin-users/AdminUserList";
import AdminUserView from "./pages/admin-users/AdminUserView";
import AdminUserCreate from "./pages/admin-users/AdminUserCreate";
import AdminUserEdit from "./pages/admin-users/AdminUserEdit";
import RoleList from "./pages/roles/RoleList";
import RoleCreate from "./pages/roles/RoleCreate";
import RoleEdit from "./pages/roles/RoleEdit";
import UserList from "./pages/users/UserList";
import UserCreate from "./pages/users/UserCreate";
import UserEdit from "./pages/users/UserEdit";
import UserView from "./pages/users/UserView";
import CourseList from "./pages/courses/CourseList";
import CourseView from "./pages/courses/CourseView";
import CourseCreate from "./pages/courses/CourseCreate";
import CourseEdit from "./pages/courses/CourseEdit";
import CoursePageSettings from "./pages/courses/CoursePageSettings";
import GlobalSettings from "./pages/settings/GlobalSettings";
import CommonSettings from "./pages/settings/CommonSettings";
import PaymentGatewaySettings from "./pages/settings/PaymentGatewaySettings";
import CoursePreview from "./pages/courses/CoursePreview";
import CourseCatList from "./pages/courses/CourseCatList";
import CourseCatCreate from "./pages/courses/CourseCatCreate";
import CourseCatEdit from "./pages/courses/CourseCatEdit";
import LiveSessions from "./pages/courses/LiveSessions";
import CourseReviewList from "./pages/courses/CourseReviewList";
import OrderList from "./pages/orders/OrderList";
import OrderView from "./pages/orders/OrderView";
import OrderCreate from "./pages/orders/OrderCreate";
import OrderEdit from "./pages/orders/OrderEdit";
import PromoCodeList from "./pages/promo-codes/PromoCodeList";
import PromoCodeCreate from "./pages/promo-codes/PromoCodeCreate";
import PromoCodeEdit from "./pages/promo-codes/PromoCodeEdit";
import CouponUsageDetail from "./pages/promo-codes/CouponUsageDetail";
import CouponUsageReport from "./pages/promo-codes/CouponUsageReport";
import PaymentLinkList from "./pages/payment-links/PaymentLinkList";
import PaymentLinkCreate from "./pages/payment-links/PaymentLinkCreate";
import PaymentLinkEdit from "./pages/payment-links/PaymentLinkEdit";
import ContactInquiryList from "./pages/contact-inquiries/ContactInquiryList";
import ContactInquiryView from "./pages/contact-inquiries/ContactInquiryView";
import AffiliateHistory from "./pages/affiliate/AffiliateHistory";
import WithdrawalRequests from "./pages/affiliate/WithdrawalRequests";
import FilesPage from "./pages/downloads/FilesPage";
import CategoriesPage from "./pages/downloads/CategoriesPage";
import MediaLibrary from "./pages/media/MediaLibrary";

function RootLayout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />}>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Dashboard: anyone with admin access */}
          <Route element={<RequirePermissionRoute permissions={["admin:access"]} />}>
            <Route index path="/" element={<Home />} />
          </Route>

          <Route path="/settings/global" element={<RequirePermissionRoute permissions={["global_settings:list", "global_settings:view", "global_settings:edit"]} />}>
            <Route index element={<GlobalSettings />} />
            <Route path="common" element={<CommonSettings />} />
          </Route>
          <Route
            path="/settings/global/payment-gateway"
            element={<PaymentGatewaySettings />}
          />
          <Route
            path="/settings/global/display-ads"
            element={
              <RequirePermissionRoute
                permissions={[
                  "global_settings:list",
                  "global_settings:view",
                  "global_settings:edit",
                  "content:list",
                  "content:view",
                  "content:edit",
                ]}
              />
            }
          >
            <Route index element={<DisplayAdsContent />} />
          </Route>

          {/* Media library */}
          <Route path="/media" element={<RequirePermissionRoute permissions={["media:list", "media:view", "media:edit"]} />}>
            <Route index element={<MediaLibrary />} />
          </Route>

          {/* Page Content / CMS — view or edit */}
          <Route element={<RequirePermissionRoute permissions={["content:list", "content:view", "content:edit"]} />}>
            <Route path="/content/home" element={<HomeContent />} />
            <Route path="/content/about" element={<AboutContent />} />
            <Route path="/content/contact" element={<ContactContent />} />
            <Route path="/content/privacy-policy" element={<PrivacyPolicyContent />} />
            <Route path="/content/ethics-policy" element={<EthicsPolicyContent />} />
            <Route path="/content/terms-of-use" element={<TermsOfUseContent />} />
            <Route path="/content/disclaimer" element={<DisclaimerContent />} />
            <Route path="/content/refund-policy" element={<RefundPolicyContent />} />
            <Route path="/content/footer" element={<FooterContent />} />
          </Route>
          <Route path="/content/display-ads" element={<Navigate to="/settings/global/display-ads" replace />} />

          {/* Articles — each sub-route requires its specific permission */}
          <Route path="/articles" element={<RequirePermissionRoute permissions={["articles:list"]} />}>
            <Route index element={<ArticleList />} />
          </Route>
          <Route path="/articles/create" element={<RequirePermissionRoute permissions={["articles:create"]} />}>
            <Route index element={<ArticleCreate />} />
          </Route>
          <Route path="/articles/preview" element={<RequirePermissionRoute permissions={["articles:view", "articles:edit"]} />}>
            <Route index element={<ArticlePreview />} />
          </Route>
          <Route path="/articles/:id" element={<RequirePermissionRoute permissions={["articles:view"]} />}>
            <Route index element={<ArticleView />} />
          </Route>
          <Route path="/articles/:id/edit" element={<RequirePermissionRoute permissions={["articles:edit"]} />}>
            <Route index element={<ArticleEdit />} />
          </Route>

          {/* Blog Categories */}
          <Route path="/article-categories" element={<RequirePermissionRoute permissions={["articles:list"]} />}>
            <Route index element={<CategoryList />} />
          </Route>
          <Route path="/article-categories/create" element={<RequirePermissionRoute permissions={["articles:create"]} />}>
            <Route index element={<CategoryCreate />} />
          </Route>
          <Route path="/article-categories/:id/edit" element={<RequirePermissionRoute permissions={["articles:edit"]} />}>
            <Route index element={<CategoryEdit />} />
          </Route>

          {/* Article Masters (tags, types, courts) */}
          <Route path="/article-masters" element={<Navigate to="/article-masters/tags" replace />} />
          <Route path="/article-masters/:kind" element={<RequirePermissionRoute permissions={["articles:list"]} />}>
            <Route index element={<ArticleMastersPage />} />
          </Route>
          <Route path="/article-masters/:kind/create" element={<RequirePermissionRoute permissions={["articles:create"]} />}>
            <Route index element={<MasterTermCreate />} />
          </Route>
          <Route path="/article-masters/:kind/:id/edit" element={<RequirePermissionRoute permissions={["articles:edit"]} />}>
            <Route index element={<MasterTermEdit />} />
          </Route>

          {/* SEO Metadata */}
          <Route path="/seo-metadata" element={<RequirePermissionRoute permissions={["seo:list"]} />}>
            <Route index element={<SEOMetadataList />} />
          </Route>
          <Route path="/seo-metadata/create" element={<RequirePermissionRoute permissions={["seo:create"]} />}>
            <Route index element={<SEOMetadataCreate />} />
          </Route>
          <Route path="/seo-metadata/site-pages" element={<RequirePermissionRoute permissions={["seo:list"]} />}>
            <Route index element={<SiteSeoRoutesPage />} />
          </Route>
          <Route path="/seo-metadata/:id" element={<RequirePermissionRoute permissions={["seo:view"]} />}>
            <Route index element={<SEOMetadataView />} />
          </Route>
          <Route path="/seo-metadata/:id/edit" element={<RequirePermissionRoute permissions={["seo:edit"]} />}>
            <Route index element={<SEOMetadataEdit />} />
          </Route>

          {/* Courses */}
          <Route path="/courses" element={<RequirePermissionRoute permissions={["courses:list"]} />}>
            <Route index element={<CourseList />} />
          </Route>
          <Route path="/courses/create" element={<RequirePermissionRoute permissions={["courses:create"]} />}>
            <Route index element={<CourseCreate />} />
          </Route>
          <Route path="/courses/:id" element={<RequirePermissionRoute permissions={["courses:view"]} />}>
            <Route index element={<CourseView />} />
          </Route>
          <Route path="/courses/:id/edit" element={<RequirePermissionRoute permissions={["courses:edit"]} />}>
            <Route index element={<CourseEdit />} />
          </Route>
          <Route path="/courses/settings" element={<RequirePermissionRoute permissions={["courses:edit"]} />}>
            <Route index element={<CoursePageSettings />} />
          </Route>
          <Route path="/courses/categories" element={<RequirePermissionRoute permissions={["course_categories:list", "courses:list"]} />}>
            <Route index element={<CourseCatList />} />
          </Route>
          <Route path="/courses/categories/create" element={<RequirePermissionRoute permissions={["course_categories:create", "courses:create"]} />}>
            <Route index element={<CourseCatCreate />} />
          </Route>
          <Route path="/courses/categories/:id/edit" element={<RequirePermissionRoute permissions={["course_categories:edit", "courses:edit"]} />}>
            <Route index element={<CourseCatEdit />} />
          </Route>
          <Route path="/courses/preview" element={<RequirePermissionRoute permissions={["courses:view"]} />}>
            <Route index element={<CoursePreview />} />
          </Route>
          <Route path="/live-sessions" element={<RequirePermissionRoute permissions={["live_sessions:list"]} />}>
            <Route index element={<LiveSessions />} />
          </Route>
          <Route path="/courses/reviews" element={<RequirePermissionRoute permissions={["course_reviews:list", "course_reviews:view", "courses:list"]} />}>
            <Route index element={<CourseReviewList />} />
          </Route>

          {/* Orders */}
          <Route path="/orders" element={<RequirePermissionRoute permissions={["orders:list"]} />}>
            <Route index element={<OrderList />} />
          </Route>
          <Route path="/orders/create" element={<RequirePermissionRoute permissions={["orders:list"]} />}>
            <Route index element={<OrderCreate />} />
          </Route>
          <Route path="/orders/:orderId" element={<RequirePermissionRoute permissions={["orders:view"]} />}>
            <Route index element={<OrderView />} />
          </Route>
          <Route path="/orders/:orderId/edit" element={<RequirePermissionRoute permissions={["orders:view"]} />}>
            <Route index element={<OrderEdit />} />
          </Route>

          {/* Coupons */}
          <Route path="/coupons" element={<RequirePermissionRoute permissions={["coupons:list"]} />}>
            <Route index element={<PromoCodeList />} />
          </Route>
          <Route path="/coupons/create" element={<RequirePermissionRoute permissions={["coupons:create"]} />}>
            <Route index element={<PromoCodeCreate />} />
          </Route>
          <Route path="/coupons/usage" element={<RequirePermissionRoute permissions={["coupons:list"]} />}>
            <Route index element={<CouponUsageReport />} />
          </Route>
          <Route path="/coupons/:id/usage" element={<RequirePermissionRoute permissions={["coupons:list"]} />}>
            <Route index element={<CouponUsageDetail />} />
          </Route>
          <Route path="/coupons/:id/edit" element={<RequirePermissionRoute permissions={["coupons:edit"]} />}>
            <Route index element={<PromoCodeEdit />} />
          </Route>

          {/* Payment Links */}
          <Route path="/payment-links" element={<RequirePermissionRoute permissions={["payment_links:list"]} />}>
            <Route index element={<PaymentLinkList />} />
          </Route>
          <Route path="/payment-links/create" element={<RequirePermissionRoute permissions={["payment_links:create"]} />}>
            <Route index element={<PaymentLinkCreate />} />
          </Route>
          <Route path="/payment-links/:id/edit" element={<RequirePermissionRoute permissions={["payment_links:edit"]} />}>
            <Route index element={<PaymentLinkEdit />} />
          </Route>

          {/* Memberships */}
          <Route path="/memberships" element={<RequirePermissionRoute permissions={["memberships:list"]} />}>
            <Route index element={<MembershipList />} />
          </Route>
          <Route path="/memberships/create" element={<RequirePermissionRoute permissions={["memberships:create"]} />}>
            <Route index element={<MembershipCreate />} />
          </Route>
          <Route path="/memberships/:id" element={<RequirePermissionRoute permissions={["memberships:view"]} />}>
            <Route index element={<MembershipView />} />
          </Route>
          <Route path="/memberships/:id/edit" element={<RequirePermissionRoute permissions={["memberships:edit"]} />}>
            <Route index element={<MembershipEdit />} />
          </Route>
          <Route path="/memberships/comparison-features" element={<RequirePermissionRoute permissions={["memberships:edit"]} />}>
            <Route index element={<ComparisonFeatures />} />
          </Route>

          {/* Google Reviews */}
          <Route path="/google-reviews" element={<RequirePermissionRoute permissions={["google_reviews:list"]} />}>
            <Route index element={<GoogleReviewList />} />
          </Route>
          <Route path="/google-reviews/create" element={<RequirePermissionRoute permissions={["google_reviews:create"]} />}>
            <Route index element={<GoogleReviewCreate />} />
          </Route>
          <Route path="/google-reviews/:id" element={<RequirePermissionRoute permissions={["google_reviews:view"]} />}>
            <Route index element={<GoogleReviewView />} />
          </Route>
          <Route path="/google-reviews/:id/edit" element={<RequirePermissionRoute permissions={["google_reviews:edit"]} />}>
            <Route index element={<GoogleReviewEdit />} />
          </Route>
          <Route path="/media-testimonials" element={<Navigate to="/testimonials" replace />} />
          <Route path="/media-testimonials/*" element={<Navigate to="/testimonials" replace />} />

          {/* Testimonials (video/image) */}
          <Route path="/testimonials" element={<RequirePermissionRoute permissions={["testimonials:list"]} />}>
            <Route index element={<TestimonialList />} />
          </Route>
          <Route path="/testimonials/create" element={<RequirePermissionRoute permissions={["testimonials:create"]} />}>
            <Route index element={<TestimonialCreate />} />
          </Route>
          <Route path="/testimonials/:id/edit" element={<RequirePermissionRoute permissions={["testimonials:edit"]} />}>
            <Route index element={<TestimonialEdit />} />
          </Route>

          {/* Marketing pages */}
          <Route path="/marketing-pages" element={<RequirePermissionRoute permissions={["marketing_pages:list"]} />}>
            <Route index element={<MarketingPageList />} />
          </Route>
          <Route path="/marketing-pages/create" element={<RequirePermissionRoute permissions={["marketing_pages:create"]} />}>
            <Route index element={<MarketingPageCreate />} />
          </Route>
          <Route path="/marketing-pages/:id" element={<RequirePermissionRoute permissions={["marketing_pages:view"]} />}>
            <Route index element={<MarketingPageView />} />
          </Route>
          <Route path="/marketing-pages/:id/edit" element={<RequirePermissionRoute permissions={["marketing_pages:edit"]} />}>
            <Route index element={<MarketingPageEdit />} />
          </Route>

          {/* FAQ */}
          <Route path="/faq" element={<RequirePermissionRoute permissions={["faq:list"]} />}>
            <Route index element={<FAQList />} />
          </Route>
          <Route path="/faq/create" element={<RequirePermissionRoute permissions={["faq:create"]} />}>
            <Route index element={<FAQCreate />} />
          </Route>
          <Route path="/faq/:id" element={<RequirePermissionRoute permissions={["faq:view"]} />}>
            <Route index element={<FAQView />} />
          </Route>
          <Route path="/faq/:id/edit" element={<RequirePermissionRoute permissions={["faq:edit"]} />}>
            <Route index element={<FAQEdit />} />
          </Route>

          {/* Newsletter */}
          <Route path="/newsletter/subscribers" element={<RequirePermissionRoute permissions={["newsletter:list"]} />}>
            <Route index element={<SubscribersList />} />
          </Route>
          <Route path="/newsletter/templates" element={<RequirePermissionRoute permissions={["newsletter:list"]} />}>
            <Route index element={<TemplatesList />} />
          </Route>
          <Route path="/newsletter/templates/create" element={<RequirePermissionRoute permissions={["newsletter:create"]} />}>
            <Route index element={<TemplateCreate />} />
          </Route>
          <Route path="/newsletter/templates/:id/edit" element={<RequirePermissionRoute permissions={["newsletter:edit"]} />}>
            <Route index element={<TemplateEdit />} />
          </Route>
          <Route path="/newsletter/send" element={<RequirePermissionRoute permissions={["newsletter:send"]} />}>
            <Route index element={<SendNewsletter />} />
          </Route>

          {/* Contact Inquiries */}
          <Route path="/contact-inquiries" element={<RequirePermissionRoute permissions={["contact_inquiries:list"]} />}>
            <Route index element={<ContactInquiryList />} />
          </Route>
          <Route path="/contact-inquiries/:id" element={<RequirePermissionRoute permissions={["contact_inquiries:view"]} />}>
            <Route index element={<ContactInquiryView />} />
          </Route>

          {/* Admin Users */}
          <Route path="/admin-users" element={<RequirePermissionRoute permissions={["admin_users:list"]} />}>
            <Route index element={<AdminUserList />} />
          </Route>
          <Route path="/admin-users/create" element={<RequirePermissionRoute permissions={["admin_users:create"]} />}>
            <Route index element={<AdminUserCreate />} />
          </Route>
          <Route path="/admin-users/:id" element={<RequirePermissionRoute permissions={["admin_users:view"]} />}>
            <Route index element={<AdminUserView />} />
          </Route>
          <Route path="/admin-users/:id/edit" element={<RequirePermissionRoute permissions={["admin_users:edit"]} />}>
            <Route index element={<AdminUserEdit />} />
          </Route>

          {/* Roles & Permissions */}
          <Route path="/roles" element={<RequirePermissionRoute permissions={["roles:list"]} />}>
            <Route index element={<RoleList />} />
          </Route>
          <Route path="/roles/create" element={<RequirePermissionRoute permissions={["roles:create"]} />}>
            <Route index element={<RoleCreate />} />
          </Route>
          <Route path="/roles/:id/edit" element={<RequirePermissionRoute permissions={["roles:edit"]} />}>
            <Route index element={<RoleEdit />} />
          </Route>

          {/* Students / Users (Non-Admin) */}
          <Route path="/users" element={<RequirePermissionRoute permissions={["students:list"]} />}>
            <Route index element={<UserList />} />
          </Route>
          <Route path="/users/create" element={<RequirePermissionRoute permissions={["students:create"]} />}>
            <Route index element={<UserCreate />} />
          </Route>
          <Route path="/users/:id" element={<RequirePermissionRoute permissions={["students:view"]} />}>
            <Route index element={<UserView />} />
          </Route>
          <Route path="/users/:id/edit" element={<RequirePermissionRoute permissions={["students:edit"]} />}>
            <Route index element={<UserEdit />} />
          </Route>
          
          {/* Affiliate */}
          <Route path="/affiliate/history" element={<RequirePermissionRoute permissions={["affiliate:list"]} />}>
            <Route index element={<AffiliateHistory />} />
          </Route>
          <Route path="/affiliate/withdrawals" element={<RequirePermissionRoute permissions={["affiliate:view"]} />}>
            <Route index element={<WithdrawalRequests />} />
          </Route>

          {/* Downloads */}
          <Route path="/downloads/files" element={<RequirePermissionRoute permissions={["downloads:list"]} />}>
            <Route index element={<FilesPage />} />
          </Route>
          <Route path="/downloads/categories" element={<RequirePermissionRoute permissions={["downloads:list"]} />}>
            <Route index element={<CategoriesPage />} />
          </Route>

          {/* Forms */}
          <Route path="/form-elements" element={<FormElements />} />

          {/* Tables */}
          <Route path="/basic-tables" element={<BasicTablesPage />} />

          {/* Ui Elements */}
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/avatars" element={<Avatars />} />
          <Route path="/badge" element={<Badges />} />
          <Route path="/buttons" element={<Buttons />} />
          <Route path="/images" element={<Images />} />
          <Route path="/videos" element={<Videos />} />

          {/* Charts */}
          <Route path="/line-chart" element={<LineChart />} />
          <Route path="/bar-chart" element={<BarChart />} />
        </Route>
      </Route>

      {/* Auth (public) */}
      <Route
        path="/signin"
        element={
          <RedirectIfAuthenticated>
            <SignIn />
          </RedirectIfAuthenticated>
        }
      />
      <Route path="/signup" element={<SignUp />} />

      {/* Fallback Route */}
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

export default function App() {
  return <RouterProvider router={router} />;
}
