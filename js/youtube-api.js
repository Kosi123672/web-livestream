// ==================== YOUTUBE API WRAPPER ====================
const YOUTUBE_API_BASE = 'AIzaSyC0CzViCU2G9s3u-oIdv2Gt_naCDPO5Mt4';
const ytCache = new Map();

const getApiKey = () => window.YOUTUBE_API_KEY || null;

// Format durasi dari ISO 8601
function formatDuration(duration) {
    if (!duration) return 'N/A';
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 'N/A';
    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');
    if (hours) return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
    return `${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
}

// Cari video di YouTube
async function fetchYouTubeVideos(query, page = 1, limit = 12) {
    const API_KEY = getApiKey();
    if (!API_KEY) return { videos: [], total: 0, nextPage: null, error: 'no_api_key' };

    const cacheKey = `yt_search_${query}_${page}_${limit}`;
    if (ytCache.has(cacheKey)) return ytCache.get(cacheKey);

    try {
        const searchParams = new URLSearchParams({
            key: API_KEY,
            part: 'snippet',
            q: query || 'anime',
            type: 'video',
            maxResults: String(limit),
            videoEmbeddable: 'true'
        });

        const searchRes = await fetch(`${YOUTUBE_API_BASE}/search?${searchParams}`);
        if (!searchRes.ok) throw new Error(`HTTP ${searchRes.status}`);
        const searchData = await searchRes.json();
        
        if (!searchData.items?.length) return { videos: [], total: 0, nextPage: null };

        const videoIds = searchData.items.map(item => item.id.videoId).filter(Boolean);
        let details = {};
        
        if (videoIds.length) {
            const detailsRes = await fetch(`${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${API_KEY}`);
            if (detailsRes.ok) {
                const detailsData = await detailsRes.json();
                detailsData.items.forEach(item => { details[item.id] = item; });
            }
        }

        const videos = searchData.items.map(item => {
            const videoId = item.id.videoId;
            const detail = details[videoId] || {};
            const snippet = item.snippet || {};
            const thumb = snippet.thumbnails?.high || snippet.thumbnails?.medium || snippet.thumbnails?.default || {};
            
            return {
                id: `yt_${videoId}`,
                title: snippet.title || 'YouTube Video',
                category: 'anime',
                description: snippet.description?.substring(0, 300) || '',
                source: 'youtube',
                youtubeId: videoId,
                youtubeSearchQuery: encodeURIComponent(`${snippet.title || ''} anime`),
                thumbnail: thumb.url || `https://via.placeholder.com/400x225/ff4d6d/ffffff?text=${encodeURIComponent(snippet.title || 'YouTube')}`,
                uploader: snippet.channelTitle || 'youtube',
                uploadedAt: snippet.publishedAt || new Date().toISOString(),
                views: detail.statistics ? parseInt(detail.statistics.viewCount) || 0 : 0,
                duration: formatDuration(detail.contentDetails?.duration),
                rating: 'N/A',
                isValid: true
            };
        }).filter(v => v.youtubeId);

        const result = { videos, total: searchData.pageInfo?.totalResults || videos.length, nextPage: null };
        ytCache.set(cacheKey, result);
        return result;
    } catch (err) {
        console.error('YouTube error:', err);
        return { videos: [], total: 0, nextPage: null, error: err.message };
    }
}

// Ambil trending
async function fetchTrendingVideos(limit = 10) {
    const API_KEY = getApiKey();
    if (!API_KEY) return [];

    const cacheKey = `yt_trending_${limit}`;
    if (ytCache.has(cacheKey)) return ytCache.get(cacheKey);

    try {
        const params = new URLSearchParams({
            key: API_KEY,
            part: 'snippet,statistics',
            chart: 'mostPopular',
            maxResults: String(limit),
            regionCode: 'ID',
            videoCategoryId: '24'
        });

        const res = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.items) return [];

        const items = data.items.map(item => {
            const snippet = item.snippet || {};
            const thumb = snippet.thumbnails?.high || snippet.thumbnails?.medium || snippet.thumbnails?.default || {};
            return {
                id: `yt_${item.id}`,
                title: snippet.title || 'YouTube',
                thumbnail: thumb.url || '',
                views: item.statistics ? parseInt(item.statistics.viewCount) || 0 : 0,
                youtubeSearchQuery: encodeURIComponent(`${snippet.title || ''} anime`)
            };
        });

        ytCache.set(cacheKey, items);
        return items;
    } catch (err) {
        console.error('Trending error:', err);
        return [];
    }
}

// Test koneksi
async function testYouTubeConnection() {
    const API_KEY = getApiKey();
    if (!API_KEY) return false;
    try {
        const res = await fetch(`${YOUTUBE_API_BASE}/search?part=snippet&type=video&maxResults=1&key=${API_KEY}&q=test`);
        return res.ok;
    } catch { return false; }
}

window.YouTubeAPI = { fetchYouTubeVideos, fetchTrendingVideos, testYouTubeConnection };