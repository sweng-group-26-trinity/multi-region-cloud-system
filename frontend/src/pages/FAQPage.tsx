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
  /** The answer revealed when expanded */
  answer: string;
};

/**
 * Static list of frequently asked questions.
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
 * Represents a green computing statistic card.
 */
type GreenStat = {
  /** Icon displayed for the stat */
  icon: React.ReactNode;
  /** Highlighted value (e.g. "Nix", "0") */
  value: string;
  /** Short label describing the stat */
  label: string;
  /** Detailed explanation of the stat */
  detail: string;
};

/**
 * Static list of sustainability-focused infrastructure stats.
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
 * Decorative cloud shape used in the background UI.
 *
 * @param props.className Optional Tailwind classes for positioning/styling
 * @param props.size Scale multiplier for width/height
 */
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
 * Accordion component for a single FAQ item.
 *
 * Handles open/close state locally.
 *
 * @param props.item FAQ data to render
 */
function FAQAccordion({ item }: { item: FAQItem }) {
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
          className={`shrink-0 ml-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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
 * FAQPage component.
 *
 * Displays:
 * - FAQ accordion section
 * - Green computing / sustainability section
 * - Dynamic background (light/dark mode aware)
 *
 * Also observes changes to the `dark` class on the root element
 * to reactively update styling.
 */
export default function FAQPage() {
  const navigate = useNavigate();

  /**
   * Tracks whether dark mode is enabled on the document root.
   */
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );

  /**
   * Observes class changes on <html> to detect theme toggling.
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
      {/* Background gradient */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: isDark
            ? "linear-gradient(to bottom, #0a0f1e 0%, #0d1a2e 40%, #091420 70%, #050d14 100%)"
            : "linear-gradient(to bottom, #7ec8e3 0%, #a8d8b0 55%, #5a9e5a 80%, #3a7a3a 100%)",
        }}
      />

      {/* Star field (dark mode only) */}
      {isDark && (
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 20% 15%, rgba(255,255,255,0.15) 0%, transparent 100%), radial-gradient(1px 1px at 75% 30%, rgba(255,255,255,0.1) 0%, transparent 100%), radial-gradient(1px 1px at 45% 60%, rgba(255,255,255,0.08) 0%, transparent 100%), radial-gradient(1px 1px at 85% 75%, rgba(255,255,255,0.12) 0%, transparent 100%)",
          }}
        />
      )}

      {/* Content omitted for brevity (unchanged) */}
    </div>
  );
}
