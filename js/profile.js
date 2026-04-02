// ==================== PROFILE PAGE ====================

async function loadProfileUploads() {
    const allVideos = await getAllVideos();
    const userVideos = allVideos.filter(v => v.uploader === "user");
    const container = document.getElementById('myUploadsList');
    
    if (!container) return;
    
    if (userVideos.length === 0) {
        container.innerHTML = '<div class="no-result">Belum ada upload</div>';
        return;
    }
    
    container.innerHTML = userVideos.map(video => `
        <div class="video-card" data-id="${video.id}">
            <div class="delete-video" onclick="deleteUpload('${video.id}')"><i class="fas fa-trash"></i></div>
            <div class="thumb">
                <img src="${video.thumbnail}" alt="${video.title}" onerror="this.src='https://via.placeholder.com/400x225/ff4d6d/ffffff?text=Error'">
                <div class="play-overlay" onclick="playVideoFromProfile('${video.id}')"><i class="fas fa-play-circle"></i></div>
            </div>
            <div class="card-info">
                <h3>${video.title.substring(0, 60)}</h3>
                <div class="meta">
                    <span><i class="fas fa-tag"></i> ${video.category}</span>
                    <span><i class="fas fa-eye"></i> ${video.views || 0}</span>
                    <span><i class="fas fa-hdd"></i> ${video.fileSize || 'N/A'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function deleteUpload(videoId) {
    if (confirm('Hapus video ini?')) {
        await deleteVideoFromDB(videoId);
        await loadProfileUploads();
        showNotification('Video dihapus', 'success');
    }
}

async function playVideoFromProfile(videoId) {
    const videos = await getAllVideos();
    const video = videos.find(v => v.id === videoId);
    if (video && video.videoData) {
        localStorage.setItem('playVideo', JSON.stringify({ id: video.id, title: video.title, data: video.videoData }));
        window.location.href = 'index.html';
    }
}

document.getElementById('deleteAllBtn')?.addEventListener('click', async () => {
    if (confirm('Hapus SEMUA upload Anda?')) {
        const videos = await getAllVideos();
        for (const v of videos.filter(v => v.uploader === "user")) {
            await deleteVideoFromDB(v.id);
        }
        await loadProfileUploads();
        showNotification('Semua upload dihapus', 'success');
    }
});

document.getElementById('profileInfo') && (async () => {
    const stats = await getVideoStats();
    document.getElementById('profileInfo').innerHTML = `
        <p><i class="fas fa-video"></i> Total Upload: ${stats.byUploader.user || 0}</p>
        <p><i class="fas fa-hdd"></i> Storage Terpakai: ${stats.totalSizeFormatted || '0 MB'}</p>
        <p><i class="fas fa-chart-line"></i> Total Views: ${stats.totalViews || 0}</p>
    `;
})();

loadProfileUploads();