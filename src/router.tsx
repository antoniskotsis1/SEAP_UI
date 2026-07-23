import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { RequireAuth } from "@/components/RequireAuth";
import { PageFallback } from "@/components/ui/PageFallback";

const LoginPage = lazy(() =>
  import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const ProducersListPage = lazy(() =>
  import("@/pages/producers/ProducersListPage").then((m) => ({
    default: m.ProducersListPage,
  })),
);
const FieldsListPage = lazy(() =>
  import("@/pages/fields/FieldsListPage").then((m) => ({
    default: m.FieldsListPage,
  })),
);
const PlantingsListPage = lazy(() =>
  import("@/pages/plantings/PlantingsListPage").then((m) => ({
    default: m.PlantingsListPage,
  })),
);
const ProductionListPage = lazy(() =>
  import("@/pages/production/ProductionListPage").then((m) => ({
    default: m.ProductionListPage,
  })),
);
const FinancialsListPage = lazy(() =>
  import("@/pages/financials/FinancialsListPage").then((m) => ({
    default: m.FinancialsListPage,
  })),
);
const FieldPhotosListPage = lazy(() =>
  import("@/pages/field-photos/FieldPhotosListPage").then((m) => ({
    default: m.FieldPhotosListPage,
  })),
);
const FieldIssuesListPage = lazy(() =>
  import("@/pages/field-issues/FieldIssuesListPage").then((m) => ({
    default: m.FieldIssuesListPage,
  })),
);

const lazyRoute = (element: ReactNode) => (
  <Suspense fallback={<PageFallback />}>{element}</Suspense>
);

export const router = createBrowserRouter(
  [
    {
      path: "/login",
      element: lazyRoute(<LoginPage />),
    },
    {
      element: (
        <RequireAuth>
          <AppLayout />
        </RequireAuth>
      ),
      children: [
        { index: true, element: lazyRoute(<DashboardPage />) },
        { path: "producers", element: lazyRoute(<ProducersListPage />) },
        { path: "fields", element: lazyRoute(<FieldsListPage />) },
        { path: "plantings", element: lazyRoute(<PlantingsListPage />) },
        { path: "production", element: lazyRoute(<ProductionListPage />) },
        { path: "financials", element: lazyRoute(<FinancialsListPage />) },
        { path: "field-photos", element: lazyRoute(<FieldPhotosListPage />) },
        { path: "field-issues", element: lazyRoute(<FieldIssuesListPage />) },
      ],
    },
  ],
  { basename: "/SEAP_UI" },
);
