import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, []);

  const showImages = useMemo(() => images.slice(0, 9), [images]);

  return (
    <section id="gallery" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.45 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Admin-curated gallery</h2>
        <p className="mt-3 text-gray-600">Images are loaded dynamically from your backend API.</p>
      </motion.div>

      {loading ? (
        <div className="mt-10 text-center text-gray-500">Loading gallery...</div>
      ) : showImages.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-500">
          No gallery images yet. Admin can upload via the admin endpoint.
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {showImages.map((image, index) => (
            <motion.figure
              key={image.url + index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              <img
                src={image.url}
                alt={image.caption || `Gallery image ${index + 1}`}
                className="h-60 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <figcaption className="px-4 py-3 text-sm text-gray-600">{image.caption}</figcaption>
            </motion.figure>
          ))}
        </div>
      )}
    </section>
  );
}
