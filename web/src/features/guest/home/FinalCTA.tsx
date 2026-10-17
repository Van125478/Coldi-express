import { Link } from "react-router-dom";
import { paths } from "@/app/paths";

const choices = [
  { label: "Tôi là chủ hàng", to: paths.shipperSolution },
  { label: "Tôi là nhà xe", to: paths.carrierSolution },
] as const;

export function FinalCTA() {
  return (
    <section className="bg-[#172554] text-white" aria-labelledby="final-cta-title">
      <div className="guest-frame py-12 sm:py-16">
        <h2 id="final-cta-title" className="max-w-xl text-[1.75rem] leading-tight font-extrabold tracking-tight text-balance sm:text-4xl">
          Khám phá giải pháp phù hợp với bạn.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75">
          Chọn cách COLDI hỗ trợ nhu cầu vận chuyển lạnh của bạn.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {choices.map((choice) => (
            <Link
              key={choice.to}
              to={choice.to}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#172554] outline-none hover:bg-white/90 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:px-6"
            >
              {choice.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
