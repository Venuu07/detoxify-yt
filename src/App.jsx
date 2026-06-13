import { useState, useEffect } from "react";

const SUGGESTED = ["Coding", "Study", "Science", "Design", "Math", "History", "Music"];

function App() {
  const [apiKey, setApiKey] = useState("");
  const [categories, setCategories] = useState("");
  const [isFilterEnabled, setIsFilterEnabled] = useState(true);
  const [isKeySaved, setIsKeySaved] = useState(false);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage) return;

    chrome.storage.local.get(
      ["geminiApiKey", "allowedCategories", "filterEnabled"],
      (result) => {
        if (result.geminiApiKey) { setApiKey(result.geminiApiKey); setIsKeySaved(true); }
        if (result.allowedCategories) setCategories(result.allowedCategories);
        if (result.filterEnabled !== undefined) setIsFilterEnabled(result.filterEnabled);
      }
    );

    chrome.storage.session.get("titleCache", (result) => {
      if (result.titleCache) setCacheSize(Object.keys(result.titleCache).length);
    });
  }, []);

  const addTopic = (topic) => {
    if (categories.toLowerCase().includes(topic.toLowerCase())) return;
    setCategories(prev => prev.trim() ? `${prev.trim()}, ${topic}` : topic);
  };

  const handleSave = () => {
    if (!apiKey.trim() || !categories.trim()) {
      setStatus("Please fill all fields.");
      return;
    }
    setIsSaving(true);
    chrome.storage.local.set(
      { geminiApiKey: apiKey.trim(), allowedCategories: categories.trim(), filterEnabled: isFilterEnabled },
      () => {
        setIsSaving(false);
        setIsKeySaved(true);
        setStatus("✓ Settings saved");
        setTimeout(() => setStatus(""), 2000);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.url?.includes("youtube.com")) {
            chrome.tabs.sendMessage(
              tabs[0].id,
              { action: "updateSettings", categories, isEnabled: isFilterEnabled },
              () => { if (chrome.runtime.lastError) {} }
            );
          }
        });
      }
    );
  };

  return (
    <div className="w-[340px] bg-[#09090b] text-white p-5 font-sans select-none">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-lg shadow-lg shadow-indigo-500/30">
            🛡
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight leading-none">Detoxify YT</h1>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-medium tracking-wide">AI FOCUS GUARDIAN</p>
          </div>
        </div>

        {/* TOGGLE */}
        <button
          onClick={() => setIsFilterEnabled(!isFilterEnabled)}
          title={isFilterEnabled ? "Disable filter" : "Enable filter"}
          className={`w-11 h-6 rounded-full relative transition-all duration-300 focus:outline-none ${
            isFilterEnabled
              ? "bg-gradient-to-r from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/30"
              : "bg-zinc-800"
          }`}
        >
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
            isFilterEnabled ? "left-6" : "left-1"
          }`} />
        </button>
      </div>

      {/* STATS BAR */}
      {cacheSize > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0d0d10] border border-zinc-800/60 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
          <span className="text-xs text-zinc-500">
            <span className="text-zinc-200 font-semibold">{cacheSize}</span> videos evaluated this session
          </span>
        </div>
      )}

      <div className="h-px bg-zinc-800/50 mb-4" />

      {/* API KEY */}
      <div className="mb-4">
        <label className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2 font-semibold">
          Gemini API Key
        </label>

        {!isKeySaved ? (
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza..."
            className="w-full bg-[#0d0d10] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-zinc-700"
          />
        ) : (
          <div className="flex items-center justify-between bg-[#0d0d10] border border-zinc-800 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-sm text-emerald-400 font-semibold">API Key Connected</span>
            </div>
            <button
              onClick={() => setIsKeySaved(false)}
              className="text-[11px] text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* TOPICS */}
      <div className="mb-4">
        <label className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2 font-semibold">
          Allowed Topics
        </label>

        <textarea
          value={categories}
          onChange={(e) => setCategories(e.target.value)}
          rows={3}
          disabled={!isFilterEnabled}
          placeholder="e.g. coding, web dev, math, science..."
          className={`w-full bg-[#0d0d10] border rounded-xl px-4 py-2.5 text-sm resize-none outline-none transition-all placeholder:text-zinc-700 ${
            isFilterEnabled
              ? "border-zinc-800 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20"
              : "border-zinc-800/50 opacity-40 cursor-not-allowed"
          }`}
        />

        {/* CHIPS */}
        {isFilterEnabled && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SUGGESTED.map((topic) => (
              <button
                key={topic}
                onClick={() => addTopic(topic)}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-indigo-500/40 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all"
              >
                + {topic}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SAVE BUTTON */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`w-full rounded-xl py-2.5 text-sm font-bold tracking-tight transition-all duration-200 ${
          isSaving
            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
        }`}
      >
        {isSaving ? "Saving..." : isFilterEnabled ? "Apply Filter" : "Save Settings"}
      </button>

      {/* STATUS */}
      {status && (
        <p className="text-center text-xs text-zinc-400 mt-3">{status}</p>
      )}

      {/* FOOTER */}
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-zinc-800/40">
        <span className="text-[10px] text-zinc-700">v1.0.0</span>
        <span className="text-[10px] text-zinc-700">by Venu Chinthakunta</span>
      </div>

    </div>
  );
}

export default App;