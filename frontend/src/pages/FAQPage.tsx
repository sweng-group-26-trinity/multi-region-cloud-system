import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, Leaf, Cloud, Zap, Server } from "lucide-react";

type FAQItem = {
  question: string;
  answer: string;
};

const faqs: FAQItem[] = [
  {
    question: "What is Toast?",
    answer:
      "Toast is a multi-region cloud-based food ordering platform that connects you to a range of restaurants. Built with resilience in mind, Toast keeps your orders flowing even if one part of our infrastructure goes offline — so your food always gets through.",
  },
  {
    question: "How do I place an order?",
    answer:
      "Head to the dashboard and pick a restaurant. Browse the menu, add items to your cart, and hit Place Order when you're ready. You'll get a confirmation once your order is successfully submitted.",
  },
  {
    question: "How do I create an account?",
    answer:
      "Click Sign Up on the homepage and fill in your details. Once registered, you can log in and start ordering straight away. If you forget your password, use the Forgot Password link on the login page.",
  },
  {
    question: "What restaurants are available?",
    answer:
      "Toast currently features Luna Pasta Bar, Saffron House, Kyoto Kitchen, El Camino, Green Bowl, and Burger Forge. We're always looking to add more — check back regularly for new additions.",
  },
];

type GreenStat = {
  icon: React.ReactNode;
  value: string;
  label: string;
  detail: string;
};

const greenStats: GreenStat[] = [
  {
    icon: <Cloud size={22} />,
    value: "2",
    label: "Cloud regions",
    detail:
      "Traffic is routed to the nearest available region, cutting unnecessary data travel and reducing latency-driven energy waste.",
  },
  {
    icon: <Zap size={22} />,
    value: "~40%",
    label: "Less idle compute",
    detail:
      "Our auto-scaling infrastructure spins down unused instances during low-traffic periods instead of running servers 24/7 at full capacity.",
  },
  {
    icon: <Server size={22} />,
    value: "99.9%",
    label: "Uptime via failover",
    detail:
      "Multi-region failover means we avoid costly full-system restarts, which are energy-intensive. Graceful degradation keeps power draw predictable.",
  },
  {
    icon: <Leaf size={22} />,
    value: "100%",
    label: "Serverless functions",
    detail:
      "Key backend operations use serverless functions that only consume compute — and energy — when actively processing a request.",
  },
];

function CloudShape({
  className,
  size = 1,
}: {
  className?: string;
  size?: number;
}) {
  const w = 80 * size;
  const h = 48 * size;
  return (
    <div className={`relative ${className}`} style={{ width: w, height: h }}>
      <div
        className="absolute bottom-0 left-0 right-0 rounded-full bg-white/60"
        style={{ height: h * 0.6 }}
      />
      <div
        className="absolute rounded-full bg-white/60"
        style={{
          width: w * 0.45,
          height: w * 0.45,
          bottom: h * 0.3,
          left: w * 0.12,
        }}
      />
      <div
        className="absolute rounded-full bg-white/60"
        style={{
          width: w * 0.38,
          height: w * 0.38,
          bottom: h * 0.35,
          left: w * 0.42,
        }}
      />
    </div>
  );
}

function FAQAccordion({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/40 rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left bg-white/70 hover:bg-white/90 transition backdrop-blur-sm"
      >
        <span className="font-semibold text-slate-800">{item.question}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 ml-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-6 py-4 bg-white/50 border-t border-white/40 backdrop-blur-sm">
          <p className="text-sm leading-relaxed text-slate-700">
            {item.answer}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * FAQ and Green Computing page for Toast.
 *
 * Provides answers to common user questions and an overview of
 * the platform's green computing practices, with a sky, cloud,
 * and earth-inspired visual theme.
 *
 * @returns React page component.
 */
export default function FAQPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Sky-to-earth gradient background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background:
            "linear-gradient(to bottom, #7ec8e3 0%, #a8d8b0 55%, #5a9e5a 80%, #3a7a3a 100%)",
        }}
      />

      {/* Decorative background clouds */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <CloudShape
          className="absolute top-8 left-[8%] opacity-80"
          size={1.4}
        />
        <CloudShape
          className="absolute top-16 left-[35%] opacity-60"
          size={1.0}
        />
        <CloudShape
          className="absolute top-6 right-[12%] opacity-75"
          size={1.6}
        />
        <CloudShape
          className="absolute top-32 right-[30%] opacity-50"
          size={0.8}
        />
        <CloudShape
          className="absolute top-48 left-[60%] opacity-40"
          size={1.1}
        />
      </div>

      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white/30 backdrop-blur-md border-b border-white/30">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-center">
          <h1 className="text-xl font-semibold tracking-tight text-white drop-shadow">
            FAQ & About
          </h1>
        </div>
      </div>

      {/* Page content */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-10 space-y-14">
        {/* FAQ Section */}
        <section>
          <h2 className="text-lg font-bold text-white drop-shadow mb-6">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FAQAccordion key={faq.question} item={faq} />
            ))}
          </div>
        </section>

        {/* Green Computing Section */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600/80 text-white shadow">
              <Leaf size={18} />
            </div>
            <h2 className="text-lg font-bold text-white drop-shadow">
              Green computing
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-white/90 drop-shadow mb-8">
            Toast is built on a multi-region cloud architecture designed not
            just for resilience, but for efficiency. Here's how our
            infrastructure actively reduces its environmental footprint.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {greenStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-sm p-5 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/80 text-white shadow">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-800 leading-none">
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-slate-700">
                  {stat.detail}
                </p>
              </div>
            ))}
          </div>

          {/* Cloud illustration card */}
          <div className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-sm p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex gap-3 shrink-0 items-end">
                <CloudShape size={1.0} />
                <CloudShape size={0.75} className="mb-1" />
                <CloudShape size={1.2} />
              </div>
              <div>
                <p className="font-semibold text-green-800 text-sm mb-1">
                  Every region, every request
                </p>
                <p className="text-sm leading-relaxed text-slate-700">
                  When you place an order, it's handled by the closest healthy
                  cloud region. Less distance means less energy — and faster
                  food.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
