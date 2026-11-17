import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { AdminModuleGuard } from "@/components/auth/AdminModuleGuard";

// Layouts
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { BuyerLayout } from "@/components/layout/BuyerLayout";
import { SupplierLayout } from "@/components/layout/SupplierLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { TransportLayout } from "@/components/layout/TransportLayout";

// Public Pages
import { HomePage } from "@/pages/public/HomePage";
import { MarketplacePage } from "@/pages/public/MarketplacePage";
import { ProductDetailPage } from "@/pages/public/ProductDetailPage";
import { CategoriesPage } from "@/pages/public/CategoriesPage";
import { DirectoriesPage } from "@/pages/public/DirectoriesPage";
import { SupplierProfilePage } from "@/pages/public/SupplierProfilePage";
import { AboutPage } from "@/pages/public/AboutPage";
import { ContactPage } from "@/pages/public/ContactPage";
import { HowCoverlyWorksPage } from "@/pages/public/HowCoverlyWorksPage";

// Auth Pages
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { EmailVerificationPage } from "@/pages/auth/EmailVerificationPage";
import { OnboardingPage } from "@/pages/auth/OnboardingPage";

// Buyer Pages
import { BuyerDashboardPage } from "@/pages/buyer/BuyerDashboardPage";
import { BuyerRfqsPage } from "@/pages/buyer/BuyerRfqsPage";
import { RfqCreatePage } from "@/pages/buyer/RfqCreatePage";
import { RfqDetailPage } from "@/pages/buyer/RfqDetailPage";
import { QuotationComparePage } from "@/pages/buyer/QuotationComparePage";
import { BuyerOrdersPage } from "@/pages/buyer/BuyerOrdersPage";
import { BuyerOrderDetailPage } from "@/pages/buyer/BuyerOrderDetailPage";
import { SavedSuppliersPage } from "@/pages/buyer/SavedSuppliersPage";
import { SavedProductsPage } from "@/pages/buyer/SavedProductsPage";
import { SourcingListsPage } from "@/pages/buyer/SourcingListsPage";
import { BuyerTeamPage } from "@/pages/buyer/BuyerTeamPage";
import { PurchaseRequestsPage } from "@/pages/buyer/PurchaseRequestsPage";
import { PurchaseOrdersPage } from "@/pages/buyer/PurchaseOrdersPage";
import { InvoicesExpensesPage } from "@/pages/buyer/InvoicesExpensesPage";
import { BuyerDocumentsPage } from "@/pages/buyer/BuyerDocumentsPage";
import { BuyerProfilePage } from "@/pages/buyer/BuyerProfilePage";
import { BuyerSettingsPage } from "@/pages/buyer/BuyerSettingsPage";
import { BuyerSupportPage } from "@/pages/buyer/BuyerSupportPage";

// Supplier Pages
import { SupplierDashboardPage } from "@/pages/supplier/SupplierDashboardPage";
import { SupplierProductsPage } from "@/pages/supplier/SupplierProductsPage";
import { ProductAddPage } from "@/pages/supplier/ProductAddPage";
import { SupplierIncomingRfqsPage } from "@/pages/supplier/SupplierIncomingRfqsPage";
import { SubmitQuotePage } from "@/pages/supplier/SubmitQuotePage";
import { SupplierOrdersPage } from "@/pages/supplier/SupplierOrdersPage";
import { SupplierVerificationPage } from "@/pages/supplier/SupplierVerificationPage";
import { SupplierBusinessProfilePage } from "@/pages/supplier/SupplierBusinessProfilePage";
import { SupplierQuotationsPage } from "@/pages/supplier/SupplierQuotationsPage";
import { SupplierAnalyticsPage } from "@/pages/supplier/SupplierAnalyticsPage";
import { SupplierSettingsPage } from "@/pages/supplier/SupplierSettingsPage";

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
import { AdminLoginPage } from "@/pages/admin/AdminLoginPage";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import { AdminVerificationsPage } from "@/pages/admin/AdminVerificationsPage";
import { AdminAuditLogsPage } from "@/pages/admin/AdminAuditLogsPage";
import { AdminSupportPage } from "@/pages/admin/AdminSupportPage";
import { AdminServicesPage } from "@/pages/admin/AdminServicesPage";
import { AdminProductsPage } from "@/pages/admin/AdminProductsPage";
import { AdminCategoriesPage } from "@/pages/admin/AdminCategoriesPage";
import { AdminBusinessesPage } from "@/pages/admin/AdminBusinessesPage";
import { AdminRfqsPage } from "@/pages/admin/AdminRfqsPage";
import { AdminLogisticsPage } from "@/pages/admin/AdminLogisticsPage";
import { AdminTransportersPage } from "@/pages/admin/AdminTransportersPage";
import { AdminBuyersPage } from "@/pages/admin/AdminBuyersPage";
import { AdminEmployeesPage } from "@/pages/admin/AdminEmployeesPage";
import { AdminOrdersPage } from "@/pages/admin/AdminOrdersPage";
import { AdminQuotationsPage } from "@/pages/admin/AdminQuotationsPage";
import { AdminFinancePage } from "@/pages/admin/AdminFinancePage";
import { AdminAnalyticsPage } from "@/pages/admin/AdminAnalyticsPage";
import { AdminSettingsPage } from "@/pages/admin/AdminSettingsPage";
import { AdminReviewsPage } from "@/pages/admin/AdminReviewsPage";
import { AdminEcosystemEntityPage } from "@/pages/admin/AdminEcosystemEntityPage";
import { AdminWarehousePage } from "@/pages/admin/AdminWarehousePage";
import { ALL_ADMIN_ROLES } from "@/lib/role-routing";

// Logistics Marketplace Pages
import { LogisticsHomePage } from "@/pages/logistics/LogisticsHomePage";
import { LogisticsDirectoryPage } from "@/pages/logistics/LogisticsDirectoryPage";
import { LogisticsCompanyDetailPage } from "@/pages/logistics/LogisticsCompanyDetailPage";
import { LogisticsBookingPage } from "@/pages/logistics/LogisticsBookingPage";
import { LogisticsTrackingPage } from "@/pages/logistics/LogisticsTrackingPage";
import { PartnerDashboardPage } from "@/pages/logistics-partner/PartnerDashboardPage";

// Transporter Marketplace Pages
import { TransporterHomePage } from "@/pages/transporters/TransporterHomePage";
import { TransporterDirectoryPage } from "@/pages/transporters/TransporterDirectoryPage";
import { TransporterDetailPage } from "@/pages/transporters/TransporterDetailPage";
import { VehicleBookingPage } from "@/pages/transporters/VehicleBookingPage";
import { TripTrackingPage } from "@/pages/transporters/TripTrackingPage";
import { TransporterDashboardPage } from "@/pages/transporters/TransporterDashboardPage";

// Sales Agent Marketplace & Console
import { SalesAgentDirectoryPage } from "@/pages/sales-agent/SalesAgentDirectoryPage";
import { SalesAgentDetailPage } from "@/pages/sales-agent/SalesAgentDetailPage";
import { SubmitBusinessRequirementPage } from "@/pages/sales-agent/SubmitBusinessRequirementPage";
import { AgentDashboardPage } from "@/pages/sales-agent/AgentDashboardPage";
import { AdminSalesAgentsPage } from "@/pages/admin/AdminSalesAgentsPage";

// Raw Material Marketplace Pages
import { RawMaterialsHomePage } from "@/pages/raw-materials/RawMaterialsHomePage";
import { RawMaterialsProductListPage } from "@/pages/raw-materials/RawMaterialsProductListPage";
import { RawMaterialDetailPage } from "@/pages/raw-materials/RawMaterialDetailPage";
import { RawMaterialSuppliersDirectoryPage } from "@/pages/raw-materials/RawMaterialSuppliersDirectoryPage";
import { RawMaterialSupplierDetailPage } from "@/pages/raw-materials/RawMaterialSupplierDetailPage";
import { BulkRfqPage } from "@/pages/raw-materials/BulkRfqPage";
import { RawMaterialSupplierDashboardPage } from "@/pages/raw-materials/RawMaterialSupplierDashboardPage";
import { AdminRawMaterialsPage } from "@/pages/admin/AdminRawMaterialsPage";

// Packaging Marketplace Pages
import { PackagingHomePage } from "@/pages/packaging/PackagingHomePage";
import { PackagingProductListPage } from "@/pages/packaging/PackagingProductListPage";
import { PackagingProductDetailPage } from "@/pages/packaging/PackagingProductDetailPage";
import { PackagingSuppliersDirectoryPage } from "@/pages/packaging/PackagingSuppliersDirectoryPage";
import { PackagingSupplierDetailPage } from "@/pages/packaging/PackagingSupplierDetailPage";
import { CustomRequirementRfqPage } from "@/pages/packaging/CustomRequirementRfqPage";
import { PackagingSupplierDashboardPage } from "@/pages/packaging/PackagingSupplierDashboardPage";
import { AdminPackagingPage } from "@/pages/admin/AdminPackagingPage";

// Import & Export International Trade Marketplace Pages
import { ImportExportHomePage } from "@/pages/import-export/ImportExportHomePage";
import { InternationalProductListPage } from "@/pages/import-export/InternationalProductListPage";
import { InternationalProductDetailPage } from "@/pages/import-export/InternationalProductDetailPage";
import { ExporterDirectoryPage } from "@/pages/import-export/ExporterDirectoryPage";
import { ImporterDirectoryPage } from "@/pages/import-export/ImporterDirectoryPage";
import { TradePartyDetailPage } from "@/pages/import-export/TradePartyDetailPage";
import { SubmitTradeRequirementPage } from "@/pages/import-export/SubmitTradeRequirementPage";
import { TradeDashboardPage } from "@/pages/import-export/TradeDashboardPage";
import { AdminTradePage } from "@/pages/admin/AdminTradePage";

// Retailer Marketplace Pages
import { RetailerLayout } from "@/components/layout/RetailerLayout";
import { RetailerDashboardPage } from "@/pages/retailer/RetailerDashboardPage";
import { RetailerProfilePage } from "@/pages/retailer/RetailerProfilePage";
import { RetailerBranchesPage } from "@/pages/retailer/RetailerBranchesPage";
import { RetailerPurchaseListsPage } from "@/pages/retailer/RetailerPurchaseListsPage";
import { RetailerReorderPage } from "@/pages/retailer/RetailerReorderPage";
import { RetailerWholesaleCatalogPage } from "@/pages/retailer/RetailerWholesaleCatalogPage";
import { RetailerOrdersPage } from "@/pages/retailer/RetailerOrdersPage";
import { AdminRetailersPage } from "@/pages/admin/AdminRetailersPage";

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
            <Route path="manufacturers/:slug" element={<SupplierProfilePage />} />
            <Route path="distributors/:slug" element={<SupplierProfilePage />} />
            <Route path="wholesalers/:slug" element={<SupplierProfilePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="how-it-works" element={<HowCoverlyWorksPage />} />
            <Route path="notifications" element={<NotificationsPage />} />

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

            {/* Public Logistics Marketplace */}
            <Route path="logistics" element={<LogisticsHomePage />} />
            <Route path="logistics/companies" element={<LogisticsDirectoryPage />} />
            <Route path="logistics/companies/:slug" element={<LogisticsCompanyDetailPage />} />
            <Route path="logistics/book" element={<LogisticsBookingPage />} />
            <Route path="logistics/quote" element={<LogisticsBookingPage />} />
            <Route path="logistics/track" element={<LogisticsTrackingPage />} />
            <Route path="track" element={<LogisticsTrackingPage />} />

            {/* Public Transporter Marketplace */}
            <Route path="transporters" element={<TransporterHomePage />} />
            <Route path="transporters/directory" element={<TransporterDirectoryPage />} />
            <Route path="transporters/book" element={<VehicleBookingPage />} />
            <Route path="transporters/track" element={<TripTrackingPage />} />
            <Route path="transporters/track/:trackingNumber" element={<TripTrackingPage />} />
            <Route path="transporters/:slug" element={<TransporterDetailPage />} />

            {/* Public Sales Agent Network & Direct Sourcing */}
            <Route path="sales-agents" element={<SalesAgentDirectoryPage />} />
            <Route path="sales-agents/requirement" element={<SubmitBusinessRequirementPage />} />
            <Route path="sales-agents/:slug" element={<SalesAgentDetailPage />} />
            <Route path="sales-agent/:slug" element={<SalesAgentDetailPage />} />

            {/* Public Raw Material Supplier Marketplace */}
            <Route path="raw-materials" element={<RawMaterialsHomePage />} />
            <Route path="raw-materials/products" element={<RawMaterialsProductListPage />} />
            <Route path="raw-materials/products/:slug" element={<RawMaterialDetailPage />} />
            <Route path="raw-materials/suppliers" element={<RawMaterialSuppliersDirectoryPage />} />
            <Route path="raw-materials/suppliers/:id" element={<RawMaterialSupplierDetailPage />} />
            <Route path="raw-materials/rfq" element={<BulkRfqPage />} />
            <Route path="raw-materials/supplier-register" element={<RawMaterialSupplierDashboardPage />} />

            {/* Public Packaging Supplier Marketplace */}
            <Route path="packaging" element={<PackagingHomePage />} />
            <Route path="packaging/products" element={<PackagingProductListPage />} />
            <Route path="packaging/products/:slug" element={<PackagingProductDetailPage />} />
            <Route path="packaging/suppliers" element={<PackagingSuppliersDirectoryPage />} />
            <Route path="packaging/suppliers/:id" element={<PackagingSupplierDetailPage />} />
            <Route path="packaging/rfq" element={<CustomRequirementRfqPage />} />
            <Route path="packaging/supplier-register" element={<PackagingSupplierDashboardPage />} />

            {/* Public Import & Export International Trade Marketplace */}
            <Route path="import-export" element={<ImportExportHomePage />} />
            <Route path="import-export/products" element={<InternationalProductListPage />} />
            <Route path="import-export/products/:slug" element={<InternationalProductDetailPage />} />
            <Route path="import-export/exporters" element={<ExporterDirectoryPage />} />
            <Route path="import-export/importers" element={<ImporterDirectoryPage />} />
            <Route path="import-export/parties/:id" element={<TradePartyDetailPage />} />
            <Route path="import-export/rfq" element={<SubmitTradeRequirementPage />} />
            <Route path="import-export/dashboard" element={<TradeDashboardPage />} />
            <Route path="import-export/register" element={<TradeDashboardPage />} />

            {/* Public Wholesale Discovery for Retailers */}
            <Route path="wholesale" element={<RetailerWholesaleCatalogPage />} />
          </Route>

          {/* Standalone Access Denied & Security Clearance (No Public Guest Header) */}
          <Route path="access-denied" element={<AccessDeniedPage />} />

          {/* 2. Authentication & Onboarding (Screens 13–19) */}
          <Route path="auth" element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="admin-login" element={<AdminLoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route path="verify-email" element={<EmailVerificationPage />} />
            <Route
              path="onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="admin/login" element={<AuthLayout><AdminLoginPage /></AuthLayout>} />

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
            <Route path="business" element={<BuyerProfilePage />} />
            <Route path="products" element={<SavedProductsPage />} />
            <Route path="suppliers" element={<SavedSuppliersPage />} />
            <Route path="enquiries" element={<BuyerRfqsPage />} />
            <Route path="quotations" element={<BuyerRfqsPage />} />
            <Route path="compare" element={<QuotationComparePage />} />
            <Route path="rfqs" element={<BuyerRfqsPage />} />
            <Route path="rfq/new" element={<RfqCreatePage />} />
            <Route path="rfqs/:id" element={<RfqDetailPage />} />
            <Route path="rfqs/:id/compare" element={<QuotationComparePage />} />
            <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
            <Route path="orders" element={<BuyerOrdersPage />} />
            <Route path="orders/:id" element={<BuyerOrderDetailPage />} />
            <Route path="logistics" element={<BuyerOrdersPage />} />
            <Route path="inventory" element={<SourcingListsPage />} />
            <Route path="saved" element={<SavedSuppliersPage />} />
            <Route path="saved-suppliers" element={<SavedSuppliersPage />} />
            <Route path="saved-products" element={<SavedProductsPage />} />
            <Route path="sourcing-lists" element={<SourcingListsPage />} />
            <Route path="team" element={<BuyerTeamPage />} />
            <Route path="branches" element={<RetailerBranchesPage />} />
            <Route path="purchase-requests" element={<PurchaseRequestsPage />} />
            <Route path="invoices" element={<InvoicesExpensesPage />} />
            <Route path="reports" element={<InvoicesExpensesPage />} />
            <Route path="documents" element={<BuyerDocumentsPage />} />
            <Route path="profile" element={<BuyerProfilePage />} />
            <Route path="settings" element={<BuyerSettingsPage />} />
            <Route path="support" element={<BuyerSupportPage />} />
          </Route>

          {/* Retailer Workspace */}
          <Route
            path="retailer"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={["retailer", "buyer", "buyer_supplier", "admin"]}>
                  <RetailerLayout />
                </RoleGuard>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/retailer/dashboard" replace />} />
            <Route path="dashboard" element={<RetailerDashboardPage />} />
            <Route path="profile" element={<RetailerProfilePage />} />
            <Route path="branches" element={<RetailerBranchesPage />} />
            <Route path="purchase-lists" element={<RetailerPurchaseListsPage />} />
            <Route path="reorder" element={<RetailerReorderPage />} />
            <Route path="wholesale" element={<RetailerWholesaleCatalogPage />} />
            <Route path="products" element={<RetailerWholesaleCatalogPage />} />
            <Route path="orders" element={<RetailerOrdersPage />} />
            <Route path="rfqs" element={<BuyerRfqsPage />} />
            <Route path="saved-products" element={<SavedProductsPage />} />
            <Route path="saved-suppliers" element={<SavedSuppliersPage />} />
            <Route path="documents" element={<BuyerDocumentsPage />} />
            <Route path="analytics" element={<RetailerOrdersPage />} />
            <Route path="support" element={<BuyerSupportPage />} />
            <Route path="settings" element={<BuyerSettingsPage />} />
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
            <Route path="profile" element={<SupplierBusinessProfilePage />} />
            <Route path="quotations" element={<SupplierQuotationsPage />} />
            <Route path="analytics" element={<SupplierAnalyticsPage />} />
            <Route path="settings" element={<SupplierSettingsPage />} />
          </Route>

          {/* Alias /manufacturer, /distributor, /wholesaler to Supplier Workspace */}
          <Route path="manufacturer" element={<Navigate to="/supplier/dashboard" replace />} />
          <Route path="manufacturer/*" element={<Navigate to="/supplier" replace />} />
          <Route path="distributor" element={<Navigate to="/supplier/dashboard" replace />} />
          <Route path="distributor/*" element={<Navigate to="/supplier" replace />} />
          <Route path="wholesaler" element={<Navigate to="/supplier/dashboard" replace />} />
          <Route path="wholesaler/*" element={<Navigate to="/supplier" replace />} />

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

          {/* 6. Dedicated Admin Control Center (Completely Separate AdminLayout & RBAC Module Guards) */}
          <Route
            path="admin"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={ALL_ADMIN_ROLES}>
                  <AdminLayout />
                </RoleGuard>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            {/* A. Overview */}
            <Route
              path="dashboard"
              element={
                <AdminModuleGuard module="overview">
                  <AdminDashboardPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="overview"
              element={
                <AdminModuleGuard module="overview">
                  <AdminDashboardPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="activity"
              element={
                <AdminModuleGuard module="overview">
                  <AdminAuditLogsPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="analytics"
              element={
                <AdminModuleGuard module="overview">
                  <AdminAnalyticsPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="notifications"
              element={
                <AdminModuleGuard module="overview">
                  <NotificationsPage />
                </AdminModuleGuard>
              }
            />

            {/* B. Business Ecosystem Management (12 Dedicated Admin Sections) */}
            <Route
              path="buyers"
              element={
                <AdminModuleGuard module="buyers">
                  <AdminBuyersPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="retailers"
              element={
                <AdminModuleGuard module="retailers">
                  <AdminRetailersPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="manufacturers"
              element={
                <AdminModuleGuard module="manufacturers">
                  <AdminEcosystemEntityPage entityType="manufacturer" />
                </AdminModuleGuard>
              }
            />
            <Route
              path="wholesalers"
              element={
                <AdminModuleGuard module="wholesalers">
                  <AdminEcosystemEntityPage entityType="wholesaler" />
                </AdminModuleGuard>
              }
            />
            <Route
              path="distributors"
              element={
                <AdminModuleGuard module="distributors">
                  <AdminEcosystemEntityPage entityType="distributor" />
                </AdminModuleGuard>
              }
            />
            <Route
              path="raw-materials"
              element={
                <AdminModuleGuard module="raw_materials">
                  <AdminRawMaterialsPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="packaging"
              element={
                <AdminModuleGuard module="packaging">
                  <AdminPackagingPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="import-export"
              element={
                <AdminModuleGuard module="import_export">
                  <AdminTradePage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="trade"
              element={
                <AdminModuleGuard module="import_export">
                  <AdminTradePage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="logistics"
              element={
                <AdminModuleGuard module="logistics">
                  <AdminLogisticsPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="shipments"
              element={
                <AdminModuleGuard module="logistics">
                  <AdminLogisticsPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="transporters"
              element={
                <AdminModuleGuard module="transporters">
                  <AdminTransportersPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="services"
              element={
                <AdminModuleGuard module="services">
                  <AdminServicesPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="business-services"
              element={
                <AdminModuleGuard module="services">
                  <AdminServicesPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="sales-agents"
              element={
                <AdminModuleGuard module="sales_agents">
                  <AdminSalesAgentsPage />
                </AdminModuleGuard>
              }
            />

            {/* C. Platform Operations */}
            <Route
              path="products"
              element={
                <AdminModuleGuard module="marketplace">
                  <AdminProductsPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="categories"
              element={
                <AdminModuleGuard module="marketplace">
                  <AdminCategoriesPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="businesses"
              element={
                <AdminModuleGuard module="marketplace">
                  <AdminBusinessesPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="suppliers"
              element={
                <AdminModuleGuard module="marketplace">
                  <AdminBusinessesPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="reviews"
              element={
                <AdminModuleGuard module="marketplace">
                  <AdminReviewsPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="rfqs"
              element={
                <AdminModuleGuard module="procurement">
                  <AdminRfqsPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="enquiries"
              element={
                <AdminModuleGuard module="procurement">
                  <AdminRfqsPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="quotations"
              element={
                <AdminModuleGuard module="procurement">
                  <AdminQuotationsPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="procurement"
              element={
                <AdminModuleGuard module="procurement">
                  <AdminBuyersPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="orders"
              element={
                <AdminModuleGuard module="orders">
                  <AdminOrdersPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="warehouse"
              element={
                <AdminModuleGuard module="warehouse">
                  <AdminWarehousePage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="finance"
              element={
                <AdminModuleGuard module="finance">
                  <AdminFinancePage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="users"
              element={
                <AdminModuleGuard module="users">
                  <AdminUsersPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="verifications"
              element={
                <AdminModuleGuard module="verification">
                  <AdminVerificationsPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="verification"
              element={
                <AdminModuleGuard module="verification">
                  <AdminVerificationsPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="support"
              element={
                <AdminModuleGuard module="support">
                  <AdminSupportPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="disputes"
              element={
                <AdminModuleGuard module="support">
                  <AdminSupportPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="employees"
              element={
                <AdminModuleGuard module="system_admin">
                  <AdminEmployeesPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="roles"
              element={
                <AdminModuleGuard module="system_admin">
                  <AdminEmployeesPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="settings"
              element={
                <AdminModuleGuard module="system_admin">
                  <AdminSettingsPage />
                </AdminModuleGuard>
              }
            />
            <Route
              path="audit-logs"
              element={
                <AdminModuleGuard module="system_admin">
                  <AdminAuditLogsPage />
                </AdminModuleGuard>
              }
            />
            {/* Unknown /admin/* subpaths stay inside Admin Control Center */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>

          {/* Logistics Partner Portal (Dedicated TransportLayout) */}
          <Route
            path="logistics-partner"
            element={
              <ProtectedRoute>
                <TransportLayout>
                  <PartnerDashboardPage />
                </TransportLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="logistics-partner/*"
            element={
              <ProtectedRoute>
                <TransportLayout>
                  <PartnerDashboardPage />
                </TransportLayout>
              </ProtectedRoute>
            }
          />

          {/* Transporter Portal (Dedicated TransportLayout) */}
          <Route
            path="transporter"
            element={
              <ProtectedRoute>
                <TransportLayout>
                  <TransporterDashboardPage />
                </TransportLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="transporter/*"
            element={
              <ProtectedRoute>
                <TransportLayout>
                  <TransporterDashboardPage />
                </TransportLayout>
              </ProtectedRoute>
            }
          />

          {/* Sales Agent Portal & Aliases */}
          <Route path="agent/dashboard" element={<AgentDashboardPage />} />
          <Route path="agent/*" element={<AgentDashboardPage />} />
          <Route path="sales-agent/dashboard" element={<Navigate to="/agent/dashboard" replace />} />
          <Route path="sales-agents/dashboard" element={<Navigate to="/agent/dashboard" replace />} />

          {/* Raw Material Supplier Portal & Aliases */}
          <Route path="raw-material-supplier/dashboard" element={<RawMaterialSupplierDashboardPage />} />
          <Route path="raw-material-supplier/*" element={<RawMaterialSupplierDashboardPage />} />
          <Route path="raw-materials/supplier/dashboard" element={<Navigate to="/raw-material-supplier/dashboard" replace />} />

          {/* Packaging Supplier Portal & Aliases */}
          <Route path="packaging-supplier/dashboard" element={<PackagingSupplierDashboardPage />} />
          <Route path="packaging-supplier/*" element={<PackagingSupplierDashboardPage />} />
          <Route path="packaging/supplier/dashboard" element={<Navigate to="/packaging-supplier/dashboard" replace />} />

          {/* Logistics & Transporter Aliases */}
          <Route path="logistics/partner/dashboard" element={<Navigate to="/logistics-partner" replace />} />
          <Route path="transporters/dashboard" element={<Navigate to="/transporter" replace />} />

          {/* International Trade Portal (Importer & Exporter) */}
          <Route path="trade/dashboard" element={<TradeDashboardPage />} />
          <Route path="trade/*" element={<TradeDashboardPage />} />

          {/* 7. Fallback 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
