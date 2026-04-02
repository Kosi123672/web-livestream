// ==================== INDEXEDDB HANDLER ====================
const DB_NAME = 'AnimeStreamDB';
const DB_VERSION = 2;
const VIDEO_STORE = 'videos';

let db = null;
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
let estimatedStorageUsed = 0;

// Inisialisasi IndexedDB
async function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB connected');
            calculateStorageUsed();
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(VIDEO_STORE)) {
                const store = db.createObjectStore(VIDEO_STORE, { keyPath: 'id' });
                store.createIndex('category', 'category');
                store.createIndex('uploadedAt', 'uploadedAt');
                store.createIndex('title', 'title');
                console.log('Video store created');
            }
        };
    });
}

// Hitung storage yang digunakan
async function calculateStorageUsed() {
    try {
        const videos = await getAllVideos();
        estimatedStorageUsed = 0;
        videos.forEach(video => {
            if (video.videoData) {
                estimatedStorageUsed += Math.ceil(video.videoData.length * 0.75);
            }
        });
        return estimatedStorageUsed;
    } catch (error) {
        return 0;
    }
}

// Generate ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

// Dapatkan durasi video
function getVideoDuration(videoDataURL) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            const minutes = Math.floor(video.duration / 60);
            const seconds = Math.floor(video.duration % 60);
            resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            URL.revokeObjectURL(video.src);
        };
        video.onerror = () => resolve('N/A');
        video.src = videoDataURL;
    });
}

// Tambah video
async function addVideo(video) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([VIDEO_STORE], 'readwrite');
        const store = transaction.objectStore(VIDEO_STORE);
        const request = store.add(video);
        request.onsuccess = () => {
            calculateStorageUsed();
            resolve(video);
        };
        request.onerror = () => reject(request.error);
    });
}

// Update video
async function updateVideo(video) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([VIDEO_STORE], 'readwrite');
        const store = transaction.objectStore(VIDEO_STORE);
        const request = store.put(video);
        request.onsuccess = () => {
            calculateStorageUsed();
            resolve(video);
        };
        request.onerror = () => reject(request.error);
    });
}

// Hapus video
async function deleteVideoFromDB(videoId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([VIDEO_STORE], 'readwrite');
        const store = transaction.objectStore(VIDEO_STORE);
        const request = store.delete(videoId);
        request.onsuccess = () => {
            calculateStorageUsed();
            resolve();
        };
        request.onerror = () => reject(request.error);
    });
}

// Hapus semua video
async function deleteAllVideos() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([VIDEO_STORE], 'readwrite');
        const store = transaction.objectStore(VIDEO_STORE);
        const request = store.clear();
        request.onsuccess = () => {
            calculateStorageUsed();
            resolve();
        };
        request.onerror = () => reject(request.error);
    });
}

// Get semua video
async function getAllVideos() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([VIDEO_STORE], 'readonly');
        const store = transaction.objectStore(VIDEO_STORE);
        const index = store.index('uploadedAt');
        const request = index.openCursor(null, 'prev');
        const videos = [];
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                videos.push(cursor.value);
                cursor.continue();
            } else {
                resolve(videos);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

// Cek dan hapus video rusak
async function checkAndRemoveInvalidVideos(onProgress) {
    const videos = await getAllVideos();
    const invalidVideos = [];
    
    for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        if (onProgress) onProgress(i + 1, videos.length, video.title);
        
        if (video.source === "upload" && video.videoData) {
            const isValid = await new Promise((resolve) => {
                const testVideo = document.createElement('video');
                const timeout = setTimeout(() => resolve(false), 5000);
                testVideo.onloadedmetadata = () => { clearTimeout(timeout); resolve(true); };
                testVideo.onerror = () => { clearTimeout(timeout); resolve(false); };
                testVideo.src = video.videoData;
            });
            if (!isValid) invalidVideos.push(video.id);
        }
    }
    
    for (const id of invalidVideos) await deleteVideoFromDB(id);
    return { removed: invalidVideos.length, total: videos.length };
}