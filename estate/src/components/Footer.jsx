export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-gray-600 sm:flex-row sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} Akiba Estate. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="#features" className="hover:text-green-700">Features</a>
          <a href="#gallery" className="hover:text-green-700">Gallery</a>
          <a href="#testimonials" className="hover:text-green-700">Testimonials</a>
        </div>
      </div>
    </footer>
  );
}
