console.log("Detoxify YT: content script actively watching ...")

function blockvideo(videoElement){

    const thumbnailContainer=videoElement.querySelector('ytd-thumbnail')
    const titleElement=videoElement.querySelector('#video-title ')

    if(thumbnailContainer){
        const img=thumbnailContainer.querySelector('img')
        if(img) img.style.display='none'

        thumbnailContainer.style.backgroundColor='#222'
        thumbnailContainer.style.display='flex'
        thumbnailContainer.style.alignItems='center'
        thumbnailContainer.style.justifyContent='center'

        if(!thumbnailContainer.querySelector('.detox-x')){
            const xMark=document.createElement('div')
            xMark.className='detox-x';
            xMark.innerText='x'
            xMark.style.color='#444'
            xMark.style.fontSize='48px'
            xMark.style.fontWeight='bold'
            thumbnailContainer.appendChild(xMark)
        }

        thumbnailContainer.style.pointerEvents="none"

        if(titleElement){
            titleElement.innerText="Distracting Content Blocked"
            titleElement.style.color="#666"
            titleElement.style.pointerEvents='none'
        }

        videoElement.dataset.detoxStatus='blocked'


    }}

    function scanForVideos(){

        const unreviewedVideos=document.querySelectorAll('ytd-rich-item-renderer:not([data-detox-status="blocked"])')

        unreviewedVideos.forEach(video=>{
            blockvideo(video);
        })
    }
        const observer=MutationObserver((mutations)=>{
            scanForVideos();
        })

        observer.observe(document.body,{
            childList:true,
            subtree:true
        })

scanForVideos();