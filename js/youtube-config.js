// ==================== YOUTUBE API CONFIGURATION ====================
// Dapatkan API Key dari: https://console.cloud.google.com/apis/credentials
// Enable YouTube Data API v3 terlebih dahulu

// GANTI DENGAN API KEY ANDA YANG VALID!
window.YOUTUBE_API_KEY = 'AIzaSyC0CzViCU2G9s3u-oIdv2Gt_naCDPO5Mt4';

// Cek apakah API Key sudah diisi
if (window.YOUTUBE_API_KEY === 'YOUR_API_KEY_HERE') {
    console.warn('⚠️ Silakan ganti YOUR_API_KEY_HERE dengan YouTube API Key Anda!');
    console.warn('📝 Dapatkan di: https://console.cloud.google.com/apis/credentials');
}