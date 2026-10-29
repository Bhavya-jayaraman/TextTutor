function Hero() {
  return (
    <section className="mx-auto flex min-h-[85vh] max-w-7xl items-center justify-between px-8">
      {/* Left Content */}
      <div className="max-w-2xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-indigo-400">
          AI-Powered Knowledge Management
        </p>

        <h1 className="text-6xl font-bold leading-tight text-white">
          Your Second Brain,
          <br />
          Powered by AI
        </h1>

        <p className="mt-6 text-lg leading-8 text-gray-400">
          Capture ideas, organize notes, upload documents, and let AI
          help you remember, search, and discover knowledge effortlessly.
        </p>

        <div className="mt-10 flex gap-4">
          <button className="rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-500">
            Get Started
          </button>

          <button className="rounded-xl border border-gray-600 px-6 py-3 text-white transition hover:border-indigo-500">
            Learn More
          </button>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex h-96 w-96 items-center justify-center rounded-3xl border border-indigo-500/30 bg-white/5 shadow-lg">
        <span className="text-7xl">🧠</span>
      </div>
    </section>
  );
}

export default Hero;