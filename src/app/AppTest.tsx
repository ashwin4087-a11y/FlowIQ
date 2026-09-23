import { useState } from 'react';
import { TrafficLightLogo } from './components/TrafficLightLogo';

export default function AppTest() {
  const [count, setCount] = useState(0);

  return (
    <div className="h-screen w-full bg-[#0F172A] text-white flex flex-col">
      {/* Header */}
      <header className="bg-[#1E293B] border-b border-[#334155] px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#00ff88] to-[#00e5ff] flex items-center justify-center">
            <span className="text-[#0a0f1a] font-bold text-sm">FQ</span>
          </div>
          <h1 className="text-2xl font-bold">FlowIQ <span className="text-[#00e5ff]">Test</span></h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-12 text-center max-w-md">
          <div className="mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00ff88] to-[#00e5ff] flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✓</span>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-2">FlowIQ Loaded!</h2>
          <p className="text-[#94A3B8] mb-6">If you see this, the React app is working correctly.</p>

          <div className="bg-[#0F172A] rounded-lg p-4 mb-6 border border-[#334155]">
            <p className="text-xs text-[#6B7A99] mb-2">Counter: {count}</p>
            <button
              onClick={() => setCount(count + 1)}
              className="w-full bg-gradient-to-r from-[#00ff88] to-[#00c96e] text-[#0a0f1a] font-bold py-2 rounded-lg hover:opacity-90 transition"
            >
              Click Me
            </button>
          </div>

          <div className="space-y-3 text-left">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#10B981] rounded-full"></span>
              <span className="text-sm">React is running</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#00ff88] rounded-full"></span>
              <span className="text-sm">CSS/Tailwind loaded</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#0EA5E9] rounded-full"></span>
              <span className="text-sm">Dev server working</span>
            </div>
          </div>

          <hr className="border-[#334155] my-6" />

          <p className="text-xs text-[#6B7A99] mb-4">
            If you see this page, your setup is working. Ready to add the main dashboard!
          </p>

          <a
            href="/flowiq-enhanced-routes.html"
            className="inline-block bg-[#0EA5E9] text-[#0a0f1a] font-bold px-6 py-2 rounded-lg hover:opacity-90 transition"
          >
            → View Route Map
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1E293B] border-t border-[#334155] px-6 py-4 text-center text-xs text-[#6B7A99]">
        FlowIQ v2.1.0 | Test App | Diagnosis Page
      </footer>
    </div>
  );
}
