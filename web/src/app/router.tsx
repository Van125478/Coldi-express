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
import { RequireAuth } from "@/app/RequireAuth";
import { MotionLabPage } from "@/features/motion-lab/MotionLabPage";
import { TransitionLabPage } from "@/pages/TransitionLabPage";

export const router = createBrowserRouter([
  { path: "/motion-lab", element: <MotionLabPage /> },
  { path: "/transition-lab", element: <TransitionLabPage /> },
  {
    element: <GuestLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "phien-ban-cu", element: <LegacyLandingPage /> },
      { path: "tim-chuyen-hang", element: <FindShipmentsPage /> },
      { path: "ve-chung-toi", element: <AboutPage /> },
      { path: "giai-phap/:audience", element: <SolutionPage /> },
      { path: "nen-tang", element: <PlatformPage /> },
      { path: "dang-don", element: <RequireAuth /> },
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
