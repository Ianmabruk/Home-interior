import { motion } from "framer-motion";
import {
  BuildingOffice2Icon,
  BellAlertIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

const items = [
  {
    title: "Manage Properties",
    desc: "Track houses, occupancy, and ownership details from one dashboard.",
    icon: BuildingOffice2Icon,
  },
  {
    title: "Smart Announcements",
    desc: "Send notices and events to everyone or specific houses instantly.",
    icon: BellAlertIcon,
  },
  {
    title: "Secure Access",
    desc: "Role-based authentication keeps admin and tenant data isolated.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Maintenance Workflow",
    desc: "Collect and resolve tenant requests with clear status tracking.",
    icon: WrenchScrewdriverIcon,
  },
  {
    title: "Payment Visibility",
    desc: "Monitor due rent, paid records, and pending balances clearly.",
    icon: CurrencyDollarIcon,
  },
  {
    title: "Built-in Chat",
    desc: "Enable quick communication between tenants and administrators.",
    icon: ChatBubbleLeftRightIcon,
  },
];

export default function Features() {
  return (
    <section id="features" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.45 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Everything your estate needs</h2>
        <p className="mx-auto mt-3 max-w-2xl text-gray-600">
          Minimal design, powerful workflows, and a smooth user experience for both admin and tenants.
        </p>
      </motion.div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="inline-flex rounded-xl bg-green-50 p-3">
                <Icon className="h-6 w-6 text-green-700" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-gray-600">{feature.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
