function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0B1020]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">

        {/* Logo */}
        <div>
          <h1 className="text-2xl font-bold text-white">
            TextTutor
          </h1>
        </div>

        {/* Navigation */}
        <ul className="flex items-center gap-8 text-gray-300">
          <li className="cursor-pointer transition-colors hover:text-white">
            Features
          </li>

          <li className="cursor-pointer transition-colors hover:text-white">
            About
          </li>

          <li className="cursor-pointer transition-colors hover:text-white">
            Contact
          </li>
        </ul>

        {/* Buttons */}
        <div className="flex items-center gap-4">
          <button className="text-white transition-colors hover:text-cyan-400">
            Login
          </button>

          <button className="rounded-xl bg-indigo-600 px-5 py-2 font-medium text-white transition hover:bg-indigo-500">
            Get Started
          </button>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;