export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-gray-900)" }}>
          Project Manager
        </h1>
        <p style={{ color: "var(--color-gray-600)" }}>
          Your operational intelligence platform
        </p>
        <a
          href="/dashboard"
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </main>
  );
}
