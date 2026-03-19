import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, ArrowLeft, LayoutDashboard } from "lucide-react";

type SummaryItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

type OrderSummaryState = {
  restaurantName: string;
  items: SummaryItem[];
  total: number;
};

export default function OrderSummaryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as OrderSummaryState | null;

  if (!state) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <h2 className="text-xl font-semibold">No order found.</h2>
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-xl bg-slate-900 px-5 py-2 text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
        >
          Back to Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <CheckCircle size={56} className="text-green-500" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Order Confirmed!</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Your order from <span className="font-semibold text-slate-700 dark:text-slate-200">{state.restaurantName}</span> has been placed successfully.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Order Summary</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {state.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                <img src={item.image} alt={item.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">x{item.quantity}</p>
                </div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  €{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t border-slate-100 bg-slate-50 px-6 py-4 font-bold text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
            <span>Total</span>
            <span>€{state.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            <ArrowLeft size={18} />
            Back to Menu
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-bold text-white transition hover:bg-orange-600"
          >
            <LayoutDashboard size={18} />
            All Restaurants
          </button>
        </div>
      </div>
    </div>
  );
}
