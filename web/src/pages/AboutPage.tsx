import { aboutFacts } from "@/content/publicCopy";
import { usePageTitle } from "@/hooks/usePageTitle";

export function AboutPage() {
  usePageTitle("Về chúng tôi");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">Về COLDI</h1>
      <p className="mt-3 text-base leading-relaxed text-ink">
        Nội dung dưới đây bám tài liệu nghiệp vụ đã chốt. Các giả định tài chính và tính năng giai đoạn sau không được trình bày như chính sách đang áp dụng.
      </p>
      <dl className="mt-8 space-y-4">
        {aboutFacts.map((fact) => (
          <div key={fact.term} className="rounded-2xl border border-line bg-surface p-5">
            <dt className="text-sm font-bold text-navy">{fact.term}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-ink">{fact.detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
