import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardPage } from "@/pages/DashboardPage";
import { ProducersListPage } from "@/pages/producers/ProducersListPage";
import { FieldsListPage } from "@/pages/fields/FieldsListPage";
import { PlantingsListPage } from "@/pages/plantings/PlantingsListPage";
import { ProductionListPage } from "@/pages/production/ProductionListPage";
import { FinancialsListPage } from "@/pages/financials/FinancialsListPage";
import { FieldPhotosListPage } from "@/pages/field-photos/FieldPhotosListPage";
import { FieldIssuesListPage } from "@/pages/field-issues/FieldIssuesListPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "producers", element: <ProducersListPage /> },
      { path: "fields", element: <FieldsListPage /> },
      { path: "plantings", element: <PlantingsListPage /> },
      { path: "production", element: <ProductionListPage /> },
      { path: "financials", element: <FinancialsListPage /> },
      { path: "field-photos", element: <FieldPhotosListPage /> },
      { path: "field-issues", element: <FieldIssuesListPage /> },
    ],
  },
]);
