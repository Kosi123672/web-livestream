// ==================== UI COMPONENTS ====================
let allVideos = [];
let currentCategory = "all";
let searchKeyword = "";
let currentSource = "all";
let isYouTubeLoading = false;

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    const bgColor = type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#ff4d6d';
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; background: ${bgColor}; color: white;
        padding: 10px 16px; border-radius: 8px; z-index: 10000; animation: slideIn 0.3s ease;
        font-size: 12px; max-width: 280px;
    `;
    notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i> ${message}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function showLoading(show, message = 'Memuat...') {
    const loader = document.getElementById('loaderWrapper');
    const text = document.getElementById('loadingText');
    if (loader) {
        if (show) {
            if (text) text.textContent = message;
            loader.style.display = 'flex';
        } else {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }
}

function renderVideoGrid() {
    let filtered = [...allVideos];
    if (currentSource === 'upload') filtered = filtered.filter(v => v.uploader === "user");
    else if (currentSource === 'youtube') filtered = filtered.filter(v => v.uploader === "youtube");
    if (currentCategory !== "all") filtered = filtered.filter(v => v.category === currentCategory);
    if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        filtered = filtered.filter(v => v.title.toLowerCase().includes(kw));
    }
    
    const grid = document.getElementById('videoGridContainer');
    const resultSpan = document.getElementById('resultCount');
    if (!grid) return;
    resultSpan.innerText = `${filtered.length} video`;
    
    if (filtered.length === 0) {
        grid.innerHTML = `<div class="no-result"><i class="fas fa-video-slash"></i><h3>Tidak ada video</h3><p>Upload video atau klik Refresh YouTube</p></div>`;
        return;
    }
    
    grid.innerHTML = filtered.map(video => `
        <div class="video-card" data-id="${video.id}">
            ${video.uploader === 'user' ? `<div class="delete-video" onclick="event.stopPropagation(); deleteVideo('${video.id}')"><i class="fas fa-trash"></i></div>` : ''}
            <div class="thumb">
                <img src="${video.thumbnail}" alt="${video.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x225/ff4d6d/ffffff?text=Error'">
                ${video.duration ? `<div class="duration">${video.duration}</div>` : ''}
                <div class="play-overlay"><i class="fas fa-play-circle"></i></div>
            </div>
            <div class="card-info">
                <h3>${escapeHtml(video.title.substring(0, 70))}</h3>
                <div class="meta">
                    <span><i class="fas fa-tag"></i> ${video.category.toUpperCase()}</span>
                    <span><i class="fas fa-eye"></i> ${video.views || 0}</span>
                    ${video.uploader === 'user' ? '<span class="uploader-badge"><i class="fas fa-user"></i> Upload</span>' : ''}
                    ${video.uploader === 'youtube' ? '<span class="youtube-badge"><i class="fab fa-youtube"></i> YouTube</span>' : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.video-card').forEach(card => {
        card.onclick = async () => {
            const video = allVideos.find(v => v.id === card.dataset.id);
            if (video) await playVideo(video);
        };
    });
}

async function updateStorageInfo() {
    const videos = await getAllVideos();
    let size = 0;
    videos.forEach(v => { if (v.videoData) size += v.videoData.length * 0.75; });
    const el = document.getElementById('storageInfo');
    if (el) el.innerHTML = `<i class="fas fa-database"></i> ${videos.length} | ${(size / 1048576).toFixed(1)}MB`;
}

async function loadAllVideos() {
    allVideos = await getAllVideos();
    await updateStorageInfo();
    renderVideoGrid();
}

async function loadYouTubeVideos(query = null, reset = true) {
    if (!window.YouTubeAPI) { showNotification('YouTube API tidak tersedia', 'error'); return; }
    if (isYouTubeLoading) return;
    isYouTubeLoading = true;
    
    if (reset) {
        allVideos = allVideos.filter(v => v.uploader !== "youtube");
        renderVideoGrid();
    }
    
    showLoading(true, 'Mengambil dari YouTube...');
    const searchText = query || searchKeyword || 'anime';
    
    try {
        const result = await YouTubeAPI.fetchYouTubeVideos(searchText, 1, 12);
        if (result?.videos?.length) {
            allVideos.push(...result.videos);
            renderVideoGrid();
            showNotification(`Loaded ${result.videos.length} video`, 'success');
        } else {
            showNotification('Tidak ada video ditemukan', 'warning');
        }
    } catch (error) {
        showNotification('Gagal memuat dari YouTube', 'error');
    }
    showLoading(false);
    isYouTubeLoading = false;
}

async function loadTrendingAnime() {
    const container = document.getElementById('trendingWrapper');
    if (!container || !window.YouTubeAPI) return;
    
    try {
        const trending = await YouTubeAPI.fetchTrendingVideos(10);
        if (trending?.length) {
            container.innerHTML = trending.map(item => `
                <div class="swiper-slide" onclick="window.open('https://www.youtube.com/results?search_query=${item.youtubeSearchQuery}', '_blank')">
                    <div class="trending-thumb">
                        <img src="${item.thumbnail}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/400x225/ff4d6d/ffffff?text=Error'">
                        <div class="play-overlay"><i class="fas fa-play-circle"></i></div>
                    </div>
                    <div class="trending-info">
                        <h4>${escapeHtml(item.title.substring(0, 45))}</h4>
                        <p><i class="fas fa-eye"></i> ${item.views} views</p>
                    </div>
                </div>
            `).join('');
            new Swiper('.trendingSwiper', {
                slidesPerView: 2.2, spaceBetween: 12,
                pagination: { el: '.swiper-pagination', clickable: true },
                breakpoints: { 640: { slidesPerView: 3.2 }, 768: { slidesPerView: 4.2 }, 1024: { slidesPerView: 5.2 } }
            });
        }
    } catch (error) { console.error(error); }
}

function setupCategories() {
    const cats = [
        { name: '✨ Semua', value: 'all' },
        { name: '📺 Anime', value: 'anime' },
        { name: '⚔️ Action', value: 'action' },
        { name: '✨ Fantasy', value: 'fantasy' },
        { name: '💖 Romance', value: 'romance' },
        { name: '🎬 Movie', value: 'movie' }
    ];
    const container = document.getElementById('categoryTabs');
    if (container) {
        container.innerHTML = cats.map(c => `<button class="cat-btn ${currentCategory === c.value ? 'active' : ''}" data-cat="${c.value}">${c.name}</button>`).join('');
        document.querySelectorAll('.cat-btn').forEach(btn => {
            btn.onclick = () => {
                currentCategory = btn.dataset.cat;
                renderVideoGrid();
                document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });
    }
}

function setupSourceSwitcher() {
    const container = document.getElementById('sourceSwitcher');
    if (container) {
        container.innerHTML = `
            <button class="source-btn ${currentSource === 'all' ? 'active' : ''}" data-source="all"><i class="fas fa-globe"></i> Semua</button>
            <button class="source-btn ${currentSource === 'upload' ? 'active' : ''}" data-source="upload"><i class="fas fa-upload"></i> Upload</button>
            <button class="source-btn ${currentSource === 'youtube' ? 'active' : ''}" data-source="youtube"><i class="fab fa-youtube"></i> YouTube</button>
            <button class="source-btn" id="refreshBtn"><i class="fas fa-sync-alt"></i> Refresh</button>
        `;
        document.querySelectorAll('.source-btn[data-source]').forEach(btn => {
            btn.onclick = () => {
                currentSource = btn.dataset.source;
                renderVideoGrid();
                document.querySelectorAll('.source-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });
        document.getElementById('refreshBtn')?.addEventListener('click', () => loadYouTubeVideos());
    }
}

function setupSearch() {
    const btn = document.getElementById('searchBtn');
    const input = document.getElementById('searchInput');
    if (btn) btn.onclick = () => { searchKeyword = input.value; renderVideoGrid(); };
    if (input) input.onkeyup = (e) => { if (e.key === 'Enter') { searchKeyword = input.value; renderVideoGrid(); } };
}

function setupCleanButton() {
    document.getElementById('cleanBtn')?.addEventListener('click', async () => {
        showLoading(true, 'Membersihkan...');
        await checkAndRemoveInvalidVideos();
        await loadAllVideos();
        showLoading(false);
        showNotification('Video rusak dihapus', 'success');
    });
}

function setupLogo() {
    document.getElementById('logo')?.addEventListener('click', () => location.reload());
}