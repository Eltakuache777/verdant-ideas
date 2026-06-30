export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="flex items-center justify-between px-8 py-6 border-b">
        <h1 className="text-2xl font-bold text-green-600">
          🌿 Verdant Ideas
        </h1>

        <nav className="space-x-6">
          <a href="#" className="hover:text-green-600">Features</a>
          <a href="#" className="hover:text-green-600">Pricing</a>
          <a href="#" className="hover:text-green-600">Login</a>
        </nav>
      </header>

      <section className="flex flex-col items-center justify-center text-center px-8 py-24">
        <h2 className="text-5xl font-bold mb-6">
          Turn Your Ideas Into Reality
        </h2>

        <p className="text-xl max-w-3xl mb-10 text-gray-600">
          Upload a photo, sketch, or describe your idea.
          AI will help create an interactive 3D model that you can
          edit, customize, and prepare for manufacturing.
        </p>

        <div className="flex gap-4">
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl">
            Start Free Trial
          </button>

          <button className="border px-6 py-3 rounded-xl">
            Watch Demo
          </button>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6 px-10 pb-24">
        <div className="p-6 border rounded-xl">
          <h3 className="text-xl font-semibold">🤖 AI Text to 3D</h3>
          <p>Create 3D models from simple descriptions.</p>
        </div>

        <div className="p-6 border rounded-xl">
          <h3 className="text-xl font-semibold">📷 Image to 3D</h3>
          <p>Upload a photo and convert it into a realistic model.</p>
        </div>

        <div className="p-6 border rounded-xl">
          <h3 className="text-xl font-semibold">🎨 Customize</h3>
          <p>Edit colors, materials, and components in 360°.</p>
        </div>
      </section>
    </main>
  );
}