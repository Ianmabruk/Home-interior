import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Stats from "../components/Stats";
import Testimonials from "../components/Testimonials";
import Gallery from "../components/Gallery";
import Footer from "../components/Footer";

export default function Landing() {
  return (
    <div className="bg-white text-gray-800">
      <Navbar />
      <Hero />
      <Features />
      <Stats />
      <Gallery />
      <Testimonials />
      <Footer />
    </div>
  );
}
