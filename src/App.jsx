import { useState, useEffect } from "react";

function App() {

  const [apiKey, setApiKey] = useState("");
  const [categories, setCategories] = useState("");
  const [isFilterEnabled, setIsFilterEnabled] = useState(true);
  const [isKeySaved, setIsKeySaved] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {

    if (typeof chrome !== "undefined" && chrome.storage) {

      chrome.storage.local.get(
        ["geminiApiKey", "allowedCategories", "filterEnabled"],
        (result) => {

          if (result.geminiApiKey) {
            setApiKey(result.geminiApiKey);
            setIsKeySaved(true);
          }

          if (result.allowedCategories) {
            setCategories(result.allowedCategories);
          }

          if (result.filterEnabled !== undefined) {
            setIsFilterEnabled(result.filterEnabled);
          }
        }
      );
    }

  }, []);

  const handleSave = () => {

    if (!apiKey.trim() || !categories.trim()) {
      setStatus("Please fill all fields");
      return;
    }

    chrome.storage.local.set(
      {
        geminiApiKey: apiKey.trim(),
        allowedCategories: categories.trim(),
        filterEnabled: isFilterEnabled
      },
      () => {

        setStatus("Settings saved");

        setIsKeySaved(true);

        setTimeout(() => {
          setStatus("");
        }, 2000);

        chrome.tabs.query(
          { active: true, currentWindow: true },
          (tabs) => {

            if (
              tabs[0] &&
              tabs[0].url.includes("youtube.com")
            ) {

              chrome.tabs.sendMessage(
                tabs[0].id,
                {
                  action: "updateSettings",
                  categories,
                  isEnabled: isFilterEnabled
                },
                () => {
                  // Suppress harmless "Receiving end does not exist" error
                  if (chrome.runtime.lastError) {
                    console.log("Tab not ready yet, ignoring.");
                  }
                }
              );
            }
          }
        );
      }
    );
  };

  return (

    <div className="w-[340px] bg-[#0f1115] text-white p-5 font-sans">

      {/* HEADER */}
      <div className="flex items-start justify-between mb-6">

        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Detoxify YT
          </h1>

          <p className="text-xs text-zinc-500 mt-1">
            Eliminate algorithmic distractions
          </p>
        </div>

        {/* TOGGLE */}
        <button
          onClick={() =>
            setIsFilterEnabled(!isFilterEnabled)
          }
          className={`w-12 h-6 rounded-full relative transition-all duration-300 ${
            isFilterEnabled
              ? "bg-blue-600"
              : "bg-zinc-700"
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${
              isFilterEnabled
                ? "left-7"
                : "left-1"
            }`}
          />
        </button>

      </div>

      {/* API KEY */}
      <div className="mb-5">

        <label className="text-xs uppercase tracking-wide text-zinc-500 block mb-2">
          Gemini API Key
        </label>

        {!isKeySaved ? (

          <input
            type="password"
            value={apiKey}
            onChange={(e) =>
              setApiKey(e.target.value)
            }
            placeholder="AIza..."
            className="
              w-full
              bg-[#171a21]
              border
              border-zinc-800
              rounded-xl
              px-4
              py-3
              text-sm
              outline-none
              focus:border-blue-500
              transition
            "
          />

        ) : (

          <div className="
            flex
            items-center
            justify-between
            bg-[#171a21]
            border
            border-zinc-800
            rounded-xl
            px-4
            py-3
          ">

            <span className="text-sm text-green-400">
              API Key Connected
            </span>

            <button
              onClick={() =>
                setIsKeySaved(false)
              }
              className="
                text-xs
                text-zinc-400
                hover:text-white
                transition
              "
            >
              Edit
            </button>

          </div>
        )}
      </div>

      {/* TOPICS */}
      <div className="mb-5">

        <label className="text-xs uppercase tracking-wide text-zinc-500 block mb-2">
          Allowed Topics
        </label>

        <textarea
          value={categories}
          onChange={(e) =>
            setCategories(e.target.value)
          }
          rows={4}
          disabled={!isFilterEnabled}
          placeholder="coding, web dev, gym..."
          className={`
            w-full
            bg-[#171a21]
            border
            rounded-xl
            px-4
            py-3
            text-sm
            resize-none
            outline-none
            transition
            ${
              isFilterEnabled
                ? "border-zinc-800 focus:border-blue-500"
                : "border-zinc-800 opacity-40 cursor-not-allowed"
            }
          `}
        />

      </div>

      {/* BUTTON */}
      <button
        onClick={handleSave}
        className="
          w-full
          bg-white
          text-black
          rounded-xl
          py-3
          text-sm
          font-medium
          hover:opacity-90
          transition
        "
      >
        {isFilterEnabled
          ? "Apply Filter"
          : "Save Settings"}
      </button>

      {/* STATUS */}
      {status && (
        <div className="
          text-center
          text-xs
          text-zinc-400
          mt-4
        ">
          {status}
        </div>
      )}

    </div>
  );
}

export default App;