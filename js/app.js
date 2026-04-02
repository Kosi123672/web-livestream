// ==================== MAIN APPLICATION ====================

async function init() {
    console.log('Initializing application...');
    
    try {
        if (window.YouTubeAPI) {
            const connected = await YouTubeAPI.testYouTubeConnection();
            console.log('YouTube API:', connected ? 'OK' : 'FAILED');
            if (!connected) showNotification('YouTube API tidak dapat diakses', 'warning');
        }
        
        await initIndexedDB();
        await loadAllVideos();
        
        setupCategories();
        setupSearch();
        setupModal();
        setupLogo();
        setupCleanButton();
        setupSourceSwitcher();
        await loadTrendingAnime();
        
        setTimeout(async () => {
            const ytVideos = allVideos.filter(v => v.uploader === "youtube");
            if (ytVideos.length === 0 && window.YouTubeAPI) await loadYouTubeVideos('anime');
        }, 1000);
        
        setTimeout(async () => {
            await checkAndRemoveInvalidVideos();
            await loadAllVideos();
        }, 3000);
        
        showLoading(false);
        console.log('App ready');
        showNotification('Aplikasi siap!', 'success');
    } catch (error) {
        console.error('Init error:', error);
        showLoading(false);
        showNotification('Gagal memuat aplikasi', 'error');
    }
}

init();