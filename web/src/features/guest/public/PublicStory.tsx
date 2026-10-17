import { Link } from "react-router-dom";

export function PublicHero({
  eyebrow,
  title,
  lede,
  image,
  imageAlt,
  href,
  cta,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  image: string;
  imageAlt: string;
  href: string;
  cta: string;
}) {
  return (
    <section className="relative isolate min-h-[34rem] overflow-hidden bg-navy-deep text-white lg:min-h-[40rem]">
      <img src={image} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-deep/90 via-navy-deep/62 to-navy-deep/25" />
      <div className="guest-frame relative flex min-h-[34rem] items-end py-16 lg:min-h-[40rem] lg:items-center lg:py-24">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-white/80 uppercase">{eyebrow}</p>
          <h1 className="mt-4 text-4xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-[3.5rem]">{title}</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85">{lede}</p>
          <Link
            to={href}
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-navy-deep hover:bg-white/90"
          >
            {cta}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function BenefitList({ title, items }: { title: string; items: readonly { title: string; body: string }[] }) {
  return (
    <section className="bg-canvas text-ink">
      <div className="guest-frame py-16 sm:py-20">
        <h2 className="max-w-xl text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h2>
        <ol className="mt-10 border-t border-line">
          {items.map((item, index) => (
            <li key={item.title} className="grid gap-3 border-b border-line py-6 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-8 sm:py-7">
              <p className="text-sm font-semibold tracking-[0.18em] text-navy">{String(index + 1).padStart(2, "0")}</p>
              <div className="max-w-2xl">
                <h3 className="text-2xl font-extrabold tracking-tight">{item.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Journey({ title, steps, aside }: { title: string; steps: readonly { title: string; body: string }[]; aside?: { image: string; imageAlt: string } }) {
  return (
    <section className="bg-surface text-ink">
      <div className="guest-frame py-16 sm:py-20">
        <div className={aside ? "grid items-center gap-10 lg:grid-cols-12 lg:gap-14" : ""}>
          <div className={aside ? "lg:col-span-7" : ""}>
            <h2 className="max-w-xl text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title} className="border-t-2 border-navy pt-4">
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-navy">{String(index + 1).padStart(2, "0")}</p>
                  <h3 className="mt-3 text-xl font-extrabold tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
          {aside ? (
            <figure className="lg:col-span-5">
              <img src={aside.image} alt={aside.imageAlt} className="aspect-[4/3] w-full object-cover" />
            </figure>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function ClosingBand({ title, body, links }: { title: string; body: string; links: readonly { href: string; label: string }[] }) {
  return (
    <section className="bg-navy-deep text-white">
      <div className="guest-frame py-16 sm:py-20">
        <h2 className="max-w-xl text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75">{body}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {links.map((link) => (
            <Link
              key={link.href + link.label}
              to={link.href}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-navy-deep hover:bg-white/90"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
