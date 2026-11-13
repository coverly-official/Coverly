import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleGuard } from "@/components/auth/RoleGuard";

// Layouts
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { BuyerLayout } from "@/components/layout/BuyerLayout";
import { SupplierLayout } from "@/components/layout/SupplierLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

// Public Pages
import { HomePage } from "@/pages/public/HomePage";
import { MarketplacePage } from "@/pages/public/MarketplacePage";
import { ProductDetailPage } from "@/pages/public/ProductDetailPage";
import { CategoriesPage } from "@/pages/public/CategoriesPage";
import { DirectoriesPage } from "@/pages/public/DirectoriesPage";
import { SupplierProfilePage } from "@/pages/public/SupplierProfilePage";
import { AboutPage } from "@/pages/public/AboutPage";
import { ContactPage } from "@/pages/public/ContactPage";

// Auth Pages
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { OnboardingPage } from "@/pages/auth/OnboardingPage";

// Buyer Pages
import { BuyerDashboardPage } from "@/pages/buyer/BuyerDashboardPage";
import { BuyerRfqsPage } from "@/pages/buyer/BuyerRfqsPage";
import { RfqCreatePage } from "@/pages/buyer/RfqCreatePage";
import { RfqDetailPage } from "@/pages/buyer/RfqDetailPage";
import { QuotationComparePage } from "@/pages/buyer/QuotationComparePage";
import { BuyerOrdersPage } from "@/pages/buyer/BuyerOrdersPage";
import { BuyerOrderDetailPage } from "@/pages/buyer/BuyerOrderDetailPage";

// Supplier Pages
import { SupplierDashboardPage } from "@/pages/supplier/SupplierDashboardPage";
import { SupplierProductsPage } from "@/pages/supplier/SupplierProductsPage";
import { ProductAddPage } from "@/pages/supplier/ProductAddPage";
import { SupplierIncomingRfqsPage } from "@/pages/supplier/SupplierIncomingRfqsPage";
import { SubmitQuotePage } from "@/pages/supplier/SubmitQuotePage";
import { SupplierOrdersPage } from "@/pages/supplier/SupplierOrdersPage";
import { SupplierVerificationPage } from "@/pages/supplier/SupplierVerificationPage";

// Business Services Pages
import { ServicesLandingPage } from "@/pages/services/ServicesLandingPage";
import { AllServicesPage } from "@/pages/services/AllServicesPage";
import { ServiceCategoryPage } from "@/pages/services/ServiceCategoryPage";
import { ServiceDetailPage } from "@/pages/services/ServiceDetailPage";
import { ProviderDirectoryPage } from "@/pages/services/ProviderDirectoryPage";
import { ProviderProfilePage } from "@/pages/services/ProviderProfilePage";
import { RequestServicePage } from "@/pages/services/RequestServicePage";
import { CustomerRequestsPage } from "@/pages/services/CustomerRequestsPage";
import { CustomerRequestDetailPage } from "@/pages/services/CustomerRequestDetailPage";

// Provider Workspace Pages & Layout
import { ProviderLayout } from "@/components/layout/ProviderLayout";
import { ProviderDashboardPage } from "@/pages/provider/ProviderDashboardPage";
import { ProviderServicesPage } from "@/pages/provider/ProviderServicesPage";
import { ProviderServiceAddPage } from "@/pages/provider/ProviderServiceAddPage";
import { ProviderInquiriesPage } from "@/pages/provider/ProviderInquiriesPage";
import { ProviderQuoteBuilderPage } from "@/pages/provider/ProviderQuoteBuilderPage";
import { ProviderActiveProjectsPage } from "@/pages/provider/ProviderActiveProjectsPage";
import { ProviderOnboardingPage } from "@/pages/provider/ProviderOnboardingPage";

// Admin Pages
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import { AdminVerificationsPage } from "@/pages/admin/AdminVerificationsPage";
import { AdminAuditLogsPage } from "@/pages/admin/AdminAuditLogsPage";
import { AdminSupportPage } from "@/pages/admin/AdminSupportPage";
import { AdminServicesPage } from "@/pages/admin/AdminServicesPage";

// Shared Pages
import { NotificationsPage } from "@/pages/shared/NotificationsPage";
import { AccessDeniedPage } from "@/pages/shared/AccessDeniedPage";
import { NotFoundPage } from "@/pages/shared/NotFoundPage";

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 1. Public Portal (Screens 1–12) & Business Services */}
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<MarketplacePage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="manufacturers" element={<DirectoriesPage />} />
            <Route path="wholesalers" element={<DirectoriesPage />} />
            <Route path="distributors" element={<DirectoriesPage />} />
            <Route path="suppliers/:slug" element={<SupplierProfilePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="access-denied" element={<AccessDeniedPage />} />

            {/* Public Business Services Marketplace */}
            <Route path="services" element={<ServicesLandingPage />} />
            <Route path="services/all" element={<AllServicesPage />} />
            <Route path="services/search" element={<AllServicesPage />} />
            <Route path="services/category/:slug" element={<ServiceCategoryPage />} />
            <Route path="services/:id" element={<ServiceDetailPage />} />
            <Route path="services/providers" element={<ProviderDirectoryPage />} />
            <Route path="services/providers/:id" element={<ProviderProfilePage />} />
            <Route path="services/request" element={<RequestServicePage />} />
            <Route
              path="services/my-requests"
              element={
                <ProtectedRoute>
                  <CustomerRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="services/my-requests/:id"
              element={
                <ProtectedRoute>
                  <CustomerRequestDetailPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* 2. Authentication & Onboarding (Screens 13–19) */}
          <Route path="auth" element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route
              path="onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* 3. Buyer Workspace (Screens 20–40) */}
          <Route
            path="buyer"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={["buyer", "buyer_supplier", "admin"]}>
                  <BuyerLayout />
                </RoleGuard>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/buyer/dashboard" replace />} />
            <Route path="dashboard" element={<BuyerDashboardPage />} />
            <Route path="rfqs" element={<BuyerRfqsPage />} />
            <Route path="rfq/new" element={<RfqCreatePage />} />
            <Route path="rfqs/:id" element={<RfqDetailPage />} />
            <Route path="rfqs/:id/compare" element={<QuotationComparePage />} />
            <Route path="orders" element={<BuyerOrdersPage />} />
            <Route path="orders/:id" element={<BuyerOrderDetailPage />} />
            <Route path="saved" element={<BuyerDashboardPage />} />
            <Route path="settings" element={<BuyerDashboardPage />} />
          </Route>

          {/* 4. Supplier Workspace (Screens 41–60) */}
          <Route
            path="supplier"
            element={
              <ProtectedRoute>
                <RoleGuard
                  allowedRoles={[
                    "manufacturer",
                    "wholesaler",
                    "distributor",
                    "buyer_supplier",
                    "admin",
                  ]}
                >
                  <SupplierLayout />
                </RoleGuard>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/supplier/dashboard" replace />} />
            <Route path="dashboard" element={<SupplierDashboardPage />} />
            <Route path="products" element={<SupplierProductsPage />} />
            <Route path="products/new" element={<ProductAddPage />} />
            <Route path="rfqs" element={<SupplierIncomingRfqsPage />} />
            <Route path="rfqs/:id/quote" element={<SubmitQuotePage />} />
            <Route path="orders" element={<SupplierOrdersPage />} />
            <Route path="verification" element={<SupplierVerificationPage />} />
            <Route path="profile" element={<SupplierDashboardPage />} />
            <Route path="quotations" element={<SupplierDashboardPage />} />
            <Route path="analytics" element={<SupplierDashboardPage />} />
            <Route path="settings" element={<SupplierDashboardPage />} />
          </Route>

          {/* 5. Provider Workspace (Business Services) */}
          <Route
            path="provider/onboarding"
            element={
              <ProtectedRoute>
                <ProviderOnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="provider"
            element={
              <ProtectedRoute>
                <RoleGuard
                  allowedRoles={[
                    "service_provider",
                    "manufacturer",
                    "wholesaler",
                    "distributor",
                    "buyer_supplier",
                    "admin",
                  ]}
                >
                  <ProviderLayout />
                </RoleGuard>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/provider/dashboard" replace />} />
            <Route path="dashboard" element={<ProviderDashboardPage />} />
            <Route path="services" element={<ProviderServicesPage />} />
            <Route path="services/new" element={<ProviderServiceAddPage />} />
            <Route path="inquiries" element={<ProviderInquiriesPage />} />
            <Route path="inquiries/:id/quote" element={<ProviderQuoteBuilderPage />} />
            <Route path="projects" element={<ProviderActiveProjectsPage />} />
            <Route path="profile" element={<ProviderDashboardPage />} />
          </Route>

          {/* 6. Admin Governance Console (Screens 61–75) */}
          <Route
            path="admin"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={["admin", "verification_admin", "support_admin"]}>
                  <AdminLayout />
                </RoleGuard>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="verifications" element={<AdminVerificationsPage />} />
            <Route path="services" element={<AdminServicesPage />} />
            <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="support" element={<AdminSupportPage />} />
          </Route>

          {/* 7. Fallback 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
