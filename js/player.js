// ==================== VIDEO PLAYER HANDLER ====================

async function playVideo(video) {
    const wrapper = document.querySelector('.video-wrapper');
    if (!wrapper) return;
    
    const oldPlayer = document.getElementById('mainPlayer');
    if (oldPlayer) oldPlayer.remove();
    
    try {
        if (video.youtubeId) {
            const iframe = document.createElement('iframe');
            iframe.id = 'mainPlayer';
            iframe.src = `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1`;
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            iframe.style.width = '100%';
            iframe.style.aspectRatio = '16 / 9';
            iframe.style.border = 'none';
            iframe.style.borderRadius = '16px';
            wrapper.appendChild(iframe);
            
            document.getElementById('currentPlayingTitle').innerHTML = `NOW PLAYING — ${video.title}`;
            video.views = (video.views || 0) + 1;
            await updateVideo(video);
            if (typeof renderVideoGrid === 'function') renderVideoGrid();
            return;
        }
        
        if (video.source === "upload" && video.videoData) {
            const videoEl = document.createElement('video');
            videoEl.id = 'mainPlayer';
            videoEl.controls = true;
            videoEl.playsInline = true;
            videoEl.webkitPlaysInline = true;
            videoEl.style.width = '100%';
            videoEl.style.aspectRatio = '16 / 9';
            videoEl.style.backgroundColor = '#000';
            videoEl.style.borderRadius = '16px';
            
            videoEl.onerror = () => showNotification('Video tidak dapat diputar', 'error');
            
            let src = video.videoData;
            if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
                if (src.match(/^[A-Za-z0-9+/=]+$/)) {
                    src = 'data:video/mp4;base64,' + src;
                }
            }
            videoEl.src = src;
            wrapper.appendChild(videoEl);
            videoEl.load();
            videoEl.play().catch(e => console.log('Autoplay blocked'));
            
            document.getElementById('currentPlayingTitle').innerHTML = `NOW PLAYING — ${video.title}`;
            video.views = (video.views || 0) + 1;
            await updateVideo(video);
            if (typeof renderVideoGrid === 'function') renderVideoGrid();
            return;
        }
        
        if (video.youtubeSearchQuery) {
            window.open(`https://www.youtube.com/results?search_query=${video.youtubeSearchQuery}`, '_blank');
            showNotification(`Mencari "${video.title}" di YouTube`, 'info');
        }
    } catch (error) {
        showNotification('Gagal memutar video', 'error');
    }
}

async function deleteVideo(videoId) {
    if (confirm('Hapus video ini?')) {
        await deleteVideoFromDB(videoId);
        if (typeof loadAllVideos === 'function') await loadAllVideos();
        showNotification('Video dihapus', 'success');
    }
}