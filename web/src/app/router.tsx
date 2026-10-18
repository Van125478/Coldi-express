import { createBrowserRouter } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { GuestLayout } from "@/components/layout/GuestLayout";
import { AboutPage } from "@/pages/AboutPage";
import { FindShipmentsPage } from "@/pages/FindShipmentsPage";
import { LandingPage } from "@/pages/LandingPage";
import { LegacyLandingPage } from "@/pages/LegacyLandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PlatformPage } from "@/pages/PlatformPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { SolutionPage } from "@/pages/SolutionPage";
import { LegacyPublishRedirect } from "@/app/LegacyPublishRedirect";
import { RoleGate } from "@/app/RoleGate";
import { ActivatedDriverGate } from "@/app/guards/ActivatedDriverGate";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { CarrierLoadBoard } from "@/features/shipments/CarrierLoadBoard";
import { ClaimedShipments } from "@/features/shipments/ClaimedShipments";
import { MotionLabPage } from "@/features/motion-lab/MotionLabPage";
import { TransitionLabPage } from "@/pages/TransitionLabPage";
import { AdminHome } from "@/features/workspace/admin/AdminHome";
import { CarrierDashboard } from "@/features/workspace/carrier/CarrierDashboard";
import { CarrierDriverProfile } from "@/features/workspace/carrier/fleet/CarrierDriverProfile";
import { CarrierDrivers } from "@/features/workspace/carrier/fleet/CarrierDrivers";
import { CarrierVehicleDetail } from "@/features/workspace/carrier/fleet/CarrierVehicleDetail";
import { CarrierVehicleForm } from "@/features/workspace/carrier/fleet/CarrierVehicleForm";
import { CarrierVehicles } from "@/features/workspace/carrier/fleet/CarrierVehicles";
import { CarrierTripDetail } from "@/features/workspace/carrier/CarrierTripDetail";
import { CreateShipmentPage } from "@/features/workspace/CreateShipmentPage";
import { DriverHome } from "@/features/workspace/driver/DriverHome";
import { DriverPasswordChange } from "@/features/workspace/driver/DriverPasswordChange";
import { DriverTripDetail } from "@/features/workspace/driver/DriverTripDetail";
import { DriverTrips } from "@/features/workspace/driver/DriverTrips";
import { ShipperDashboard } from "@/features/workspace/shipper/ShipperDashboard";
import { ShipperShipmentDetail } from "@/features/workspace/shipper/ShipperShipmentDetail";
import { ShipperShipments } from "@/features/workspace/shipper/ShipperShipments";
import { AccountPlanPage } from "@/features/packages/AccountPlanPage";
import { CommissionHistoryPage } from "@/features/commission/CommissionHistoryPage";
import { PackageCatalogPage } from "@/features/packages/PackageCatalogPage";

export const router = createBrowserRouter([
  { path: "/motion-lab", element: <MotionLabPage /> },
  { path: "/transition-lab", element: <TransitionLabPage /> },
  { path: "/dang-don", element: <LegacyPublishRedirect /> },
  {
    element: <RoleGate role="SHIPPER" />,
    children: [
      {
        element: <WorkspaceLayout />,
        children: [
          { path: "/shipper", element: <ShipperDashboard /> },
          { path: "/shipper/tao-don", element: <CreateShipmentPage /> },
          { path: "/shipper/don-hang", element: <ShipperShipments /> },
          { path: "/shipper/don-hang/:id", element: <ShipperShipmentDetail /> },
          { path: "/shipper/hoa-hong", element: <CommissionHistoryPage /> },
          { path: "/shipper/goi", element: <AccountPlanPage /> },
        ],
      },
    ],
  },
  {
    element: <RoleGate role="CARRIER" />,
    children: [
      {
        element: <WorkspaceLayout />,
        children: [
          { path: "/carrier", element: <CarrierDashboard /> },
          { path: "/carrier/tim-chuyen", element: <CarrierLoadBoard /> },
          { path: "/carrier/chuyen-cua-toi", element: <ClaimedShipments /> },
          { path: "/carrier/chuyen/:id", element: <CarrierTripDetail /> },
          { path: "/carrier/hoa-hong", element: <CommissionHistoryPage /> },
          { path: "/carrier/doi-xe", element: <CarrierVehicles /> },
          { path: "/carrier/doi-xe/xe/moi", element: <CarrierVehicleForm mode="create" /> },
          { path: "/carrier/doi-xe/xe/:id", element: <CarrierVehicleDetail /> },
          { path: "/carrier/doi-xe/xe/:id/sua", element: <CarrierVehicleForm mode="edit" /> },
          { path: "/carrier/doi-xe/tai-xe", element: <CarrierDrivers /> },
          { path: "/carrier/doi-xe/tai-xe/:id", element: <CarrierDriverProfile /> },
          { path: "/carrier/goi", element: <AccountPlanPage /> },
        ],
      },
    ],
  },
  {
    element: <RoleGate role="DRIVER" />,
    children: [
      { path: "/driver/doi-mat-khau", element: <DriverPasswordChange /> },
      {
        element: <ActivatedDriverGate />,
        children: [
          {
            element: <WorkspaceLayout />,
            children: [
              { path: "/driver", element: <DriverHome /> },
              { path: "/driver/chuyen", element: <DriverTrips /> },
              { path: "/driver/chuyen/:id", element: <DriverTripDetail /> },
            ],
          },
        ],
      },
    ],
  },
  {
    element: <RoleGate role="ADMIN" />,
    children: [
      {
        element: <WorkspaceLayout />,
        children: [{ path: "/admin", element: <AdminHome /> }],
      },
    ],
  },
  {
    element: <GuestLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "phien-ban-cu", element: <LegacyLandingPage /> },
      { path: "tim-chuyen-hang", element: <FindShipmentsPage /> },
      { path: "ve-chung-toi", element: <AboutPage /> },
      { path: "goi-dich-vu", element: <PackageCatalogPage /> },
      { path: "giai-phap/:audience", element: <SolutionPage /> },
      { path: "nen-tang", element: <PlatformPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "dang-nhap", element: <LoginPage /> },
      { path: "dang-ky", element: <RegisterPage /> },
    ],
  },
]);
