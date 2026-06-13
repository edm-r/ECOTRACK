function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">ECOTRACK</h1>
        <p className="mt-2 text-gray-500">Plateforme intelligente de gestion des déchets</p>
        <div className="mt-4 flex justify-center gap-2">
          <span className="rounded-full bg-status-normal px-3 py-1 text-sm text-white">Normal</span>
          <span className="rounded-full bg-status-watch px-3 py-1 text-sm text-white">Surveiller</span>
          <span className="rounded-full bg-status-critical px-3 py-1 text-sm text-white">Critique</span>
        </div>
      </div>
    </div>
  );
}

export default App;
