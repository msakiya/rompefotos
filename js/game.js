// js/game.js
document.addEventListener('DOMContentLoaded', async () => {
    const isLoggedIn = await checkAuth();
    if (!isLoggedIn) {
        window.location.href = 'index.html';
        return;
    }

    const photoId = sessionStorage.getItem('currentPhotoId');
    const photoUrl = sessionStorage.getItem('currentPhotoUrl');
    if (!photoId || !photoUrl) {
        window.location.href = 'dashboard.html';
        return;
    }

    document.getElementById('back-btn').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    const levelSelection = document.getElementById('level-selection');
    const puzzleArea = document.getElementById('puzzle-area');
    const puzzleGrid = document.getElementById('puzzle-grid');
    const movesCountSpan = document.getElementById('moves-count');
    const winModal = document.getElementById('win-modal');
    
    // Set preview image
    document.getElementById('preview-img').src = photoUrl;

    let gridSize = 4;
    let moves = 0;
    let pieces = [];
    let selectedPiece = null;
    let imageObj = new Image();
    
    imageObj.src = photoUrl;

    // Handle level selection
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            gridSize = parseInt(btn.getAttribute('data-size'));
            levelSelection.style.display = 'none';
            puzzleArea.style.display = 'block';
            initGame();
        });
    });

    function initGame() {
        moves = 0;
        updateMoves();
        pieces = [];
        puzzleGrid.innerHTML = '';
        selectedPiece = null;
        
        // Make the grid square, responsive to screen width
        const containerWidth = Math.min(window.innerWidth * 0.9, 500);
        puzzleGrid.style.width = `${containerWidth}px`;
        puzzleGrid.style.height = `${containerWidth}px`;
        puzzleGrid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        puzzleGrid.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

        const pieceSize = 100 / gridSize; // percentage

        // Create pieces
        for (let i = 0; i < gridSize * gridSize; i++) {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;

            const piece = document.createElement('div');
            piece.className = 'puzzle-piece';
            piece.dataset.index = i;
            piece.dataset.correctIndex = i;

            // Background positioning
            piece.style.backgroundImage = `url(${photoUrl})`;
            piece.style.backgroundPosition = `${col * (100 / (gridSize - 1))}% ${row * (100 / (gridSize - 1))}%`;
            piece.style.backgroundSize = `${gridSize * 100}% ${gridSize * 100}%`;

            // Interaction
            piece.addEventListener('click', () => handlePieceClick(piece));

            pieces.push(piece);
        }

        // Shuffle logic (fisher-yates)
        const shuffledIndices = [...Array(pieces.length).keys()];
        for (let i = shuffledIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
        }

        // Render shuffled
        shuffledIndices.forEach(idx => {
            puzzleGrid.appendChild(pieces[idx]);
        });
    }

    function handlePieceClick(piece) {
        if (!selectedPiece) {
            selectedPiece = piece;
            piece.classList.add('selected');
        } else {
            if (selectedPiece !== piece) {
                swapPieces(selectedPiece, piece);
                moves++;
                updateMoves();
                checkWin();
            }
            selectedPiece.classList.remove('selected');
            selectedPiece = null;
        }
    }

    function swapPieces(p1, p2) {
        // Swap in DOM
        const p1Next = p1.nextSibling === p2 ? p1 : p1.nextSibling;
        const p2Next = p2.nextSibling === p1 ? p2 : p2.nextSibling;
        
        puzzleGrid.insertBefore(p1, p2Next);
        puzzleGrid.insertBefore(p2, p1Next);
    }

    function checkWin() {
        const currentPieces = Array.from(puzzleGrid.children);
        const isWin = currentPieces.every((p, index) => parseInt(p.dataset.correctIndex) === index);

        if (isWin) {
            setTimeout(handleWin, 300);
        }
    }

    async function handleWin() {
        document.getElementById('final-moves').textContent = moves;
        winModal.classList.add('active');

        try {
            // Save score
            await fetchAPI('scores.php', 'POST', {
                photo_id: photoId,
                grid_size: gridSize,
                moves: moves
            });

            // Fetch leaderboard
            const data = await fetchAPI(`scores.php?action=leaderboard&photo_id=${photoId}`);
            const list = document.getElementById('leaderboard-list');
            list.innerHTML = '';
            
            data.scores.forEach((s, i) => {
                const li = document.createElement('li');
                li.innerHTML = `<span>#${i+1} (${s.grid_size}x${s.grid_size})</span> <span><strong>${s.moves}</strong> movs</span>`;
                list.appendChild(li);
            });
        } catch (err) {
            console.error('Failed to save score or fetch leaderboard', err);
            const list = document.getElementById('leaderboard-list');
            list.innerHTML = `<li style="color:var(--text-muted); text-align:center; font-size: 0.9rem;">Estás jugando sin conexión.<br>Tu tiempo no fue guardado en el ranking.</li>`;
        }
    }

    function updateMoves() {
        movesCountSpan.textContent = moves;
    }

    // Modal Buttons
    document.getElementById('play-again-btn').addEventListener('click', () => {
        winModal.classList.remove('active');
        levelSelection.style.display = 'block';
        puzzleArea.style.display = 'none';
    });

    document.getElementById('dashboard-btn').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
});
