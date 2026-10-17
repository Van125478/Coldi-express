import { Link } from "react-router-dom";
import { paths } from "@/app/paths";
import { KeyframeBoard } from "@/features/transition-lab/KeyframeBoard";
import { PhaseOnePreview } from "@/features/transition-lab/PhaseOnePreview";
import { usePageTitle } from "@/hooks/usePageTitle";

export function TransitionLabPage() {
  usePageTitle("Chuyển cảnh");

  return (
    <main className="min-h-svh bg-[#050914] text-white">
      <div className="mx-auto flex w-full max-w-[1100px] items-center justify-end px-4 pt-4 sm:px-8">
        <Link to={paths.home} className="inline-flex min-h-11 items-center text-sm font-semibold text-white/75">
          Về trang khách
        </Link>
      </div>
      <PhaseOnePreview />
      <KeyframeBoard />
    </main>
  );
}
