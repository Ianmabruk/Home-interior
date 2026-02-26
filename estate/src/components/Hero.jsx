import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";

const fallbackImages = [
  {
    url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80",
    caption: "Modern estate living",
  },
  {
    url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=80",
    caption: "Premium homes for families",
  },
  {
    url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80",
    caption: "Beautifully managed communities",
  },
];

export default function Hero() {
  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const loadImages = async () => {
      try {
        const response = await axios.get("/api/public/images");
        const payload = Array.isArray(response.data) ? response.data : [];
        const normalized = payload
          .map((item) => {
            if (typeof item === "string") {
              return { url: item, caption: "Akiba Estate" };
            }
            if (item?.url) {
              return { url: item.url, caption: item.caption || "Akiba Estate" };
            }
            return null;
          })
          .filter(Boolean);

        setImages(normalized);
      } catch (error) {
        setImages([]);
      }
    };

    loadImages();
  }, []);

  const heroImages = useMemo(
    () => (images.length > 0 ? images : fallbackImages),
    [images]
  );

  useEffect(() => {
    if (heroImages.length <= 1) return undefined;

    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [heroImages]);

  return (
    <section id="home" className="mx-auto grid min-h-[84vh] w-full max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col justify-center"
      >
        <span className="inline-flex w-fit items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700">
          Modern Property SaaS
        </span>
        <h1 className="mt-5 text-4xl font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
          Welcome Home to <span className="text-green-700">Akiba Estate</span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-gray-600 sm:text-lg">
          Manage payments, notices, events, maintenance, and resident communication with one clean portal for admins and tenants.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/signup"
            className="rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white transition-transform duration-300 hover:scale-[1.02] hover:bg-green-700"
          >
            Create Account
          </Link>
          <Link
            to="/login"
            className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Login
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.55 }}
        className="relative h-[360px] overflow-hidden rounded-3xl border border-gray-200 shadow-lg sm:h-[440px]"
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={heroImages[index].url}
            src={heroImages[index].url}
            alt={heroImages[index].caption}
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </AnimatePresence>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-5 text-white">
          <p className="text-sm font-medium">{heroImages[index].caption}</p>
          <div className="mt-3 flex gap-2">
            {heroImages.map((item, dotIndex) => (
              <button
                key={item.url + dotIndex}
                onClick={() => setIndex(dotIndex)}
                className={`h-2.5 rounded-full transition-all ${
                  dotIndex === index ? "w-7 bg-white" : "w-2.5 bg-white/60"
                }`}
                aria-label={`Show slide ${dotIndex + 1}`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
