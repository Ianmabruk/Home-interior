import { motion } from "framer-motion";

const stats = [
  ["350+", "Houses Managed"],
  ["800+", "Residents"],
  ["5+", "Years Experience"],
  ["99%", "Satisfaction"],
];

export default function Stats() {
  return (
    <section id="stats" className="bg-green-50">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-8 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8 lg:py-16">
        {stats.map(([value, label], index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.35, delay: index * 0.08 }}
            className="text-center"
          >
            <p className="text-3xl font-bold text-green-700 sm:text-4xl">{value}</p>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">{label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
