import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Leaf,
  Cloud,
  Zap,
  Server,
  Package,
  Monitor,
} from "lucide-react";
/**
 * Represents a single FAQ entry.
 */
type FAQItem = {
  /** The question displayed in the accordion header */
  question: string;

  /** The answer shown when the accordion is expanded */
  answer: string;
};

/**
 * Static list of FAQ items displayed on the page.
 */
const faqs: FAQItem[] = [
  {
    question: "What is DineHub?",
    answer:
      "DineHub is a multi-region cloud-based food ordering platform that connects you to a range of restaurants. Built with resilience in mind, DineHub keeps your orders flowing even if one part of our infrastructure goes offline, so your food always gets through.",
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
      "DineHub currently features Luna Pasta Bar, Saffron House, Kyoto Kitchen, El Camino, Green Bowl, and Burger Forge. We're always looking to add more, check back regularly for new additions.",
  },
];

/**
 * Represents a statistic highlighting green computing practices.
 */
type GreenStat = {
  /** Icon displayed alongside the stat */
  icon: React.ReactNode;

  /** Primary value (e.g., "Nix", "0") */
  value: string;

  /** Short label describing the stat */
  label: string;

  /** Detailed explanation of the stat */
  detail: string;
};

/**
 * Collection of green computing statistics shown in the UI.
 */
const greenStats: GreenStat[] = [
  {
    icon: <Package size={22} />,
    value: "Nix",
    label: "Nix + Garnix CI",
    detail:
      "Order of magnitude better caching than Docker means fewer rebuilds, less compute wasted, and faster pipelines with a fraction of the energy.",
  },
  {
    icon: <Zap size={22} />,
    value: "GraalVM",
    label: "Native compilation",
    detail:
      "GraalVM compiles our backend to a native binary, lower resource usage, a smaller bundle, and fast startup that enables rapid, efficient scaling.",
  },
  {
    icon: <Cloud size={22} />,
    value: "Around €25",
    label: "Low CO₂ cloud regions",
    detail:
      "We host in low carbon cloud regions, cutting costs from ~€32 to €25 while reducing our carbon footprint at the infrastructure level.",
  },
  {
    icon: <Server size={22} />,
    value: "0",
    label: "Idle VMs",
    detail:
      "VM startup and shutdown scripts automatically stop instances during off-peak hours. No idle servers, no wasted energy.",
  },
  {
    icon: <Leaf size={22} />,
    value: "React",
    label: "Virtual DOM",
    detail:
      "React's Virtual DOM ensures only changed components re-render, reducing unnecessary client side CPU cycles and lowering device power draw.",
  },
  {
    icon: <Monitor size={22} />,
    value: "Dark",
    label: "Dark mode",
    detail:
      "Our dark mode reduces power draw on screens, putting energy savings directly in users' hands.",
  },
];

/**
 * Props for the CloudShape component.
 */
type CloudShapeProps = {
  /** Optional CSS class names */
  className?: string;

  /** Scale factor for the cloud size */
  size?: number;
};

/**
 * Decorative cloud shape used in the background.
 *
 * Renders layered rounded divs to simulate a cloud.
 */
function CloudShape({ className, size = 1 }: CloudShapeProps) {
  const w = 80 * size;
  const h = 48 * size;

  return (
    <div className={`relative ${className}`} style={{ width: w, height: h }}>
      <div
        className="absolute bottom-0 left-0 right-0 rounded-full bg-white/60 dark:bg-white/10"
        style={{ height: h * 0.6 }}
      />
      <div
        className="absolute rounded-full bg-white/60 dark:bg-white/10"
        style={{
          width: w * 0.45,
          height: w * 0.45,
          bottom: h * 0.3,
          left: w * 0.12,
        }}
      />
      <div
        className="absolute rounded-full bg-white/60 dark:bg-white/10"
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

/**
 * Props for FAQAccordion component.
 */
type FAQAccordionProps = {
  /** FAQ item to render */
  item: FAQItem;
};

/**
 * Accordion component for displaying a single FAQ entry.
 *
 * Handles its own open/close state.
 */
function FAQAccordion({ item }: FAQAccordionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-white/40 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left bg-white/70 hover:bg-white/90 dark:bg-white/5 dark:hover:bg-white/10 transition backdrop-blur-sm"
      >
        <span className="font-semibold text-slate-800 dark:text-slate-100">
          {item.question}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 ml-4 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="px-6 py-4 bg-white/50 dark:bg-white/5 border-t border-white/40 dark:border-white/10 backdrop-blur-sm">
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {item.answer}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Main FAQ page component.
 *
 * Displays:
 * - FAQ accordion list
 * - Green computing statistics
 * - Decorative cloud background
 *
 * Also observes the document's `dark` class to dynamically update styling.
 */
export default function FAQPage() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  /**
   * Tracks whether dark mode is active by checking the root HTML class.
   */
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );

  /**
   * Observes changes to the document's class list to detect dark mode toggling.
   */
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background - light: sky gradient, dark: dark blue-black */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: isDark
            ? "linear-gradient(to bottom, #0a0f1e 0%, #0d1a2e 40%, #091420 70%, #050d14 100%)"
            : "linear-gradient(to bottom, #7ec8e3 0%, #a8d8b0 55%, #5a9e5a 80%, #3a7a3a 100%)",
        }}
      />

      {/* Subtle star-like dots (dark mode only) */}
      {isDark && (
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 20% 15%, rgba(255,255,255,0.15) 0%, transparent 100%), radial-gradient(1px 1px at 75% 30%, rgba(255,255,255,0.1) 0%, transparent 100%), radial-gradient(1px 1px at 45% 60%, rgba(255,255,255,0.08) 0%, transparent 100%), radial-gradient(1px 1px at 85% 75%, rgba(255,255,255,0.12) 0%, transparent 100%)",
          }}
        />
      )}

      {/* Decorative background clouds */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <CloudShape
          className="absolute top-8 left-[8%] opacity-80 dark:opacity-30"
          size={1.4}
        />
        <CloudShape
          className="absolute top-16 left-[35%] opacity-60 dark:opacity-20"
          size={1.0}
        />
        <CloudShape
          className="absolute top-6 right-[12%] opacity-75 dark:opacity-25"
          size={1.6}
        />
        <CloudShape
          className="absolute top-32 right-[30%] opacity-50 dark:opacity-15"
          size={0.8}
        />
        <CloudShape
          className="absolute top-48 left-[60%] opacity-40 dark:opacity-10"
          size={1.1}
        />
      </div>

      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white/30 dark:bg-black/40 backdrop-blur-md border-b border-white/30 dark:border-white/10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-center">
          <h1 className="text-xl font-semibold tracking-tight text-white drop-shadow">
            FAQ & About
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-10 space-y-14">
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

        <section>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 dark:text-emerald-400 shadow border border-emerald-500/20">
              <Leaf size={18} />
            </div>
            <h2 className="text-lg font-bold text-white drop-shadow">
              Green computing
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-white/90 dark:text-slate-400 drop-shadow mb-8">
            DineHub is built on a multi-region cloud architecture designed not
            just for resilience, but for efficiency. Here's how our
            infrastructure actively reduces its environmental footprint.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {greenStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-5 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/80 dark:bg-emerald-500/20 text-white dark:text-emerald-400 shadow border border-emerald-500/20">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-800 dark:text-emerald-400 leading-none">
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-500 mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-400">
                  {stat.detail}
                </p>
              </div>
            ))}
          </div>

          {/* Cloud illustration card */}
          <div className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex gap-3 shrink-0 items-end">
                <CloudShape size={1.0} />
                <CloudShape size={0.75} className="mb-1" />
                <CloudShape size={1.2} />
              </div>
              <div>
                <p className="font-semibold text-green-800 dark:text-emerald-400 text-sm mb-1">
                  Every region, every request
                </p>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-400">
                  When you place an order, it's handled by the closest healthy
                  cloud region. Less distance means less energy and faster food.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
