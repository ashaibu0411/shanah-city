import Link from "next/link";

const cards = [
  {
    title: "Small Groups",
    description: "Find or start a ministry group — choir, men's ministry, youth, and more.",
    href: "/groups",
    cta: "Browse groups",
  },
  {
    title: "Give",
    description: "Support the mission of Shanah City and serve our community.",
    href: "/give",
    cta: "Give online",
  },
  {
    title: "Prayer",
    description: "Share a prayer request and let our team pray with you.",
    href: "/connect",
    cta: "Submit a request",
  },
];

export function ConnectSection() {
  return (
    <section className="bg-sand-100 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sand-600">
            Get Involved
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-night-900">
            Connect with us
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-night-900/5"
            >
              <h3 className="font-display text-2xl font-semibold text-night-900">
                {card.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-night-600">
                {card.description}
              </p>
              <Link
                href={card.href}
                className="mt-6 inline-block text-sm font-semibold text-night-800 hover:text-night-950"
              >
                {card.cta} →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
