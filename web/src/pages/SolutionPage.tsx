import { Link, useParams } from "react-router-dom";
import { paths } from "@/app/paths";
import { solutions, type SolutionId } from "@/content/publicCopy";
import { usePageTitle } from "@/hooks/usePageTitle";

function isSolutionId(value: string | undefined): value is SolutionId {
  return value === "chu-hang" || value === "nha-xe";
}

export function SolutionPage() {
  const { audience } = useParams();
  const known = isSolutionId(audience);
  const solution = known ? solutions[audience] : null;
  usePageTitle(solution?.title ?? "Giải pháp đối tác");

  if (!solution) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold text-navy">Không có giải pháp này</h1>
        <p className="mt-3 text-base leading-relaxed text-ink">Trang đối tác chỉ mô tả Chủ hàng và Nhà xe.</p>
        <Link to={paths.home} className="mt-6 inline-flex min-h-11 items-center font-semibold text-navy">
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-muted">Giải pháp đối tác</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">{solution.title}</h1>
      <p className="mt-3 text-base leading-relaxed text-ink">{solution.lede}</p>
      <ul className="mt-6 space-y-3">
        {solution.points.map((point) => (
          <li key={point} className="rounded-2xl border border-line bg-surface p-4 text-sm leading-relaxed text-ink">
            {point}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm leading-relaxed text-muted">{solution.limit}</p>
    </div>
  );
}
