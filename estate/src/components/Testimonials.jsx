import { motion } from "framer-motion";

const items = [
  {
    quote: "Managing my house info, payments, and notices now takes minutes instead of hours.",
    name: "Steven M.",
    role: "Resident",
  },
  {
    quote: "The platform is clean and simple. I never miss updates from management anymore.",
    name: "Sarah W.",
    role: "Tenant",
  },
  {
    quote: "As an admin, the dashboard gives me full control with a professional experience.",
    name: "Grace N.",
    role: "Estate Manager",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.45 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">What residents say</h2>
        <p className="mt-3 text-gray-600">Trusted by modern estates for clarity and speed.</p>
      </motion.div>

      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        {items.map((item, index) => (
          <motion.article
            key={item.name}
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-gray-700">“{item.quote}”</p>
            <p className="mt-5 font-semibold text-green-700">{item.name}</p>
            <p className="text-sm text-gray-500">{item.role}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
