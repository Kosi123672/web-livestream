// ==================== UPLOAD HANDLER ====================

function readFileAsDataURL(file, onProgress) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e.target.error);
        if (onProgress) reader.onprogress = onProgress;
        reader.readAsDataURL(file);
    });
}

async function uploadVideoWithIndexedDB(event) {
    event.preventDefault();
    
    const title = document.getElementById('videoTitle').value;
    const category = document.getElementById('videoCategory').value;
    const description = document.getElementById('videoDescription').value;
    const videoFile = document.getElementById('videoFile').files[0];
    const thumbnailFile = document.getElementById('thumbnailFile').files[0];
    
    if (!title || !videoFile) {
        alert('Mohon isi judul dan pilih file video!');
        return;
    }
    
    if (videoFile.size > MAX_VIDEO_SIZE) {
        alert(`File terlalu besar! Maksimal ${formatFileSize(MAX_VIDEO_SIZE)}`);
        return;
    }
    
    const submitBtn = document.getElementById('submitUpload');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    
    submitBtn.disabled = true;
    progressBar.classList.add('active');
    
    try {
        const videoData = await readFileAsDataURL(videoFile, (progress) => {
            const percent = (progress.loaded / progress.total) * 60;
            progressFill.style.width = percent + '%';
        });
        progressFill.style.width = '60%';
        
        let thumbnailData = null;
        if (thumbnailFile) {
            thumbnailData = await readFileAsDataURL(thumbnailFile);
        }
        progressFill.style.width = '75%';
        
        const duration = await getVideoDuration(videoData);
        progressFill.style.width = '90%';
        
        const newVideo = {
            id: generateId(),
            title, category, description,
            source: "upload",
            videoData: videoData,
            thumbnail: thumbnailData || `https://via.placeholder.com/400x225/ff4d6d/ffffff?text=${encodeURIComponent(title.substring(0, 20))}`,
            uploader: "user",
            uploadedAt: new Date().toISOString(),
            views: 0,
            duration: duration,
            fileSize: formatFileSize(videoFile.size),
            isValid: true
        };
        
        await addVideo(newVideo);
        progressFill.style.width = '100%';
        
        setTimeout(() => {
            document.getElementById('uploadModal').classList.remove('active');
            document.getElementById('uploadForm').reset();
            progressBar.classList.remove('active');
            progressFill.style.width = '0%';
            submitBtn.disabled = false;
            if (typeof loadAllVideos === 'function') loadAllVideos();
            showNotification('Video berhasil diupload!', 'success');
        }, 500);
    } catch (error) {
        alert('Gagal upload: ' + error.message);
        progressBar.classList.remove('active');
        submitBtn.disabled = false;
    }
}

function setupModal() {
    const uploadBtn = document.getElementById('uploadBtn');
    const modal = document.getElementById('uploadModal');
    const cancelBtn = document.getElementById('cancelUpload');
    const closeBtn = document.getElementById('closeModalBtn');
    const form = document.getElementById('uploadForm');
    
    if (uploadBtn) uploadBtn.onclick = () => modal.classList.add('active');
    if (cancelBtn) cancelBtn.onclick = () => modal.classList.remove('active');
    if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');
    if (modal) modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
    if (form) form.onsubmit = uploadVideoWithIndexedDB;
}