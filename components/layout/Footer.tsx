export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} CodeDrill. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
