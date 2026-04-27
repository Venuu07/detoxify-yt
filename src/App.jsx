import { useState,useEffect } from "react";

function App(){

  const [apiKey,setApiKey] = useState('');
  const [categories,setCategories] = useState('');
  const [isFilterEnabled,setIsFilterEnabled]=useState(true)
  const [isKeySaved,setIsKeySaved] = useState(false);
  const [status,setStatus] = useState('');

  useEffect(()=>{

    if(typeof chrome!=='undefined' && chrome.storage){
      chrome.storage.local.get(['geminiApiKey','allowedCategories','filterEnabled'],(result)=>{
        if(result.geminiApiKey){
          setApiKey(result.geminiApiKey)
          setIsKeySaved(true)
        }
        if(result.allowedCategories) setCategories(result.allowedCategories)
        if(result.filterEnabled !== undefined) setIsFilterEnabled(result.filterEnabled)
      })
    }
  },[])

  const handleSave=()=>{
    if(!apiKey.trim() || !categories.trim()){
      setStatus('Please fill in all fields');
      return;
    }

    if(typeof chrome !='undefined' && chrome.storage){
      chrome.storage.local.set({
        geminiApiKey:apiKey.trim(),
        allowedCategories:categories.trim(),
        filterEnabled:isFilterEnabled
      },()=>{
        setStatus('Settings securely saved')
        setIsKeySaved(true)
        setTimeout(()=> setStatus(''),2000)

        chrome.tabs.query({active:true,currentWindow:true},(tabs)=>{
          if(tabs[0] && tabs[0].url.includes("youtube.com")) {
            chrome.tabs.sendMessage(tabs[0].id,{
              action:'updateSettings',
              categories:categories,
              isEnabled:isFilterEnabled
            })
          }
        })
      })
    }
    
  };

  return(
    <div className='w-80 p-5 bg-gray-900 text-gray-100 font-sans shadow-xl'>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-blue-400"> Detoxify YT</h1>
          <p className="text-xs text-gray-400">Impossible to Distracted.</p>
        </div>

      <label className='relative inline-flex items-center cursor-pointer'>
        <input
          type='checkbox'
          className="sr-only-peer"
          checked={isFilterEnabled}
          onChange={()=> setIsFilterEnabled(!isFilterEnabled)}
        />
        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>

       
      </label>
      </div>

      <div className="space-y-4">
        { !isKeySaved ? (
          <div>
            <label className='block text-sm font-medium text-gray-300 mb-1'>
              Gemini API key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e)=> setApiKey(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-b-gray-700 rounded text-sm focus:outline-none focus:border-blue-500 text-white"
              placeholder="AIfjKu..."
            />
          </div>
        ) :(<div className="flex justify-between items-center bg-gray-800 p-2 rounded border border-green-900">
          <span className="text-xs text-green-400 font-medium">API Key Active</span>
          <button
            onClick={() => setIsKeySaved(false)}
              className="text-xs text-gray-400 hover:text-white underline"
          >
            Edit
          </button>
        </div>)}

        <div>
          <label
            className="block text-sm font-medium text-gray-300 mb-1"
          >Allowed Topics</label>
          <textarea
           value={categories}  
           onChange={(e)=>setCategories(e.target.value)}
           className={`w-full px-3 py-2 bg-gray-800 border rounded text-sm focus:outline-none text-white resize-none ${isFilterEnabled ? 'border-gray-700 focus:border-blue-500' : 'border-gray-700 opacity-50 cursor-not-allowed'}`}
           placeholder="eg.. coding,web dev,gym,standup comedy ..."
           rows={3}
           disabled={!isFilterEnabled}
          />
          <button
            onClick={handleSave}
            className="w-full bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            {isFilterEnabled ? 'Apply Strict Filter' :'Save Settings (Filter Off'}
          </button>

          {status && (
            <p className="text-sm text-center mt-2 text-green-400 transition-opacity">
              {status}
            </p>
          )}
        </div>
      </div>

    </div>
  )
}

export default App;