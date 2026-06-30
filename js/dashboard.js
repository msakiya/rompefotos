// js/dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
    const isLoggedIn = await checkAuth();
    if (!isLoggedIn) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('logout-btn').addEventListener('click', logout);

    const fileInput = document.getElementById('photo-upload');
    const fileNameDisplay = document.getElementById('file-name');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadForm = document.getElementById('upload-form');
    const statusDiv = document.getElementById('upload-status');
    const galleryContainer = document.getElementById('gallery-container');

    // Handle file selection
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            fileNameDisplay.textContent = e.target.files[0].name;
            uploadBtn.disabled = false;
        } else {
            fileNameDisplay.textContent = 'Seleccionar imagen (JPG, PNG, WEBP)';
            uploadBtn.disabled = true;
        }
    });

    // Handle Upload
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (fileInput.files.length === 0) return;

        const formData = new FormData();
        formData.append('photo', fileInput.files[0]);

        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Subiendo...';
        statusDiv.textContent = '';

        try {
            const response = await fetch('api/upload.php', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.message);

            // Go to game with new photo ID and URL
            sessionStorage.setItem('currentPhotoId', data.photo.id);
            sessionStorage.setItem('currentPhotoUrl', data.photo.url);
            window.location.href = 'game.html';

        } catch (err) {
            statusDiv.innerHTML = `<span style="color: var(--danger)">${err.message}</span>`;
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Subir y Jugar';
        }
    });

    // Load Gallery
    async function loadGallery() {
        try {
            const data = await fetchAPI('scores.php?action=gallery');
            if (data.photos.length === 0) {
                galleryContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No tienes fotos aún. ¡Sube una para empezar!</p>';
                return;
            }

            galleryContainer.innerHTML = '';
            data.photos.forEach(photo => {
                const item = document.createElement('div');
                item.className = 'gallery-item';
                
                // Format scores securely
                const score4 = photo.best_4x4 ? `${photo.best_4x4} movs` : '-';
                const score5 = photo.best_5x5 ? `${photo.best_5x5} movs` : '-';
                const score6 = photo.best_6x6 ? `${photo.best_6x6} movs` : '-';

                item.innerHTML = `
                    <div class="gallery-img-wrapper">
                        <img src="${photo.url}" alt="Puzzle Photo">
                    </div>
                    <div class="gallery-info">
                        <p><strong>Mejores Tiempos:</strong></p>
                        <p>4x4: ${score4}</p>
                        <p>5x5: ${score5}</p>
                        <p>6x6: ${score6}</p>
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button class="btn btn-sm btn-primary play-btn" style="flex: 1;">Jugar</button>
                            <a href="${photo.url}" download="${photo.filename}" class="btn btn-sm btn-outline" style="flex: 1; text-align: center; text-decoration: none; display: flex; align-items: center; justify-content: center;">Descargar</a>
                        </div>
                    </div>
                `;

                // Add click listener only to the Play button
                const playBtn = item.querySelector('.play-btn');
                playBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    sessionStorage.setItem('currentPhotoId', photo.id);
                    sessionStorage.setItem('currentPhotoUrl', photo.url);
                    window.location.href = 'game.html';
                });

                galleryContainer.appendChild(item);
            });
        } catch (err) {
            galleryContainer.innerHTML = `<p style="grid-column: 1/-1; color: var(--danger);">Error cargando galería.</p>`;
        }
    }

    loadGallery();
});
