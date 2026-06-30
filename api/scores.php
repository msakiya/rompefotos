<?php
// api/scores.php
require_once 'config.php';
requireLogin();

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

if ($method === 'POST') {
    // Save a new score
    $input = json_decode(file_get_contents('php://input'), true);
    
    $photoId = isset($input['photo_id']) ? intval($input['photo_id']) : 0;
    $gridSize = isset($input['grid_size']) ? intval($input['grid_size']) : 0;
    $moves = isset($input['moves']) ? intval($input['moves']) : 0;
    
    if (!$photoId || !in_array($gridSize, [4, 5, 6]) || $moves <= 0) {
        sendJson(['status' => 'error', 'message' => 'Invalid data'], 400);
    }
    
    // Verify photo belongs to user
    $stmt = $db->prepare("SELECT id FROM photos WHERE id = ? AND user_id = ?");
    $stmt->execute([$photoId, $_SESSION['user_id']]);
    if (!$stmt->fetch()) {
         sendJson(['status' => 'error', 'message' => 'Photo not found or unauthorized'], 403);
    }
    
    $stmt = $db->prepare("INSERT INTO scores (user_id, photo_id, grid_size, moves) VALUES (?, ?, ?, ?)");
    try {
        $stmt->execute([$_SESSION['user_id'], $photoId, $gridSize, $moves]);
        sendJson(['status' => 'success', 'message' => 'Score saved successfully']);
    } catch (PDOException $e) {
        sendJson(['status' => 'error', 'message' => 'Failed to save score'], 500);
    }

} elseif ($method === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : 'gallery';
    
    if ($action === 'gallery') {
        // Get user's photos with their best scores
        $stmt = $db->prepare("
            SELECT p.id, p.filename, p.uploaded_at,
                   MIN(CASE WHEN s.grid_size = 4 THEN s.moves END) as best_4x4,
                   MIN(CASE WHEN s.grid_size = 5 THEN s.moves END) as best_5x5,
                   MIN(CASE WHEN s.grid_size = 6 THEN s.moves END) as best_6x6
            FROM photos p
            LEFT JOIN scores s ON p.id = s.photo_id
            WHERE p.user_id = ?
            GROUP BY p.id
            ORDER BY p.uploaded_at DESC
        ");
        $stmt->execute([$_SESSION['user_id']]);
        $photos = $stmt->fetchAll();
        
        // Format URLs
        foreach ($photos as &$photo) {
            $photo['url'] = 'uploads/' . $photo['filename'];
        }
        
        sendJson(['status' => 'success', 'photos' => $photos]);
        
    } elseif ($action === 'leaderboard') {
        // Optional: Global leaderboard or specific photo leaderboard
        $photoId = isset($_GET['photo_id']) ? intval($_GET['photo_id']) : 0;
        if (!$photoId) {
            sendJson(['status' => 'error', 'message' => 'photo_id required'], 400);
        }
        
        // Get top 10 scores for this photo for the logged in user
        $stmt = $db->prepare("
            SELECT grid_size, moves, created_at 
            FROM scores 
            WHERE user_id = ? AND photo_id = ? 
            ORDER BY grid_size ASC, moves ASC
        ");
        $stmt->execute([$_SESSION['user_id'], $photoId]);
        $scores = $stmt->fetchAll();
        
        sendJson(['status' => 'success', 'scores' => $scores]);
    } else {
        sendJson(['status' => 'error', 'message' => 'Invalid action'], 400);
    }
} else {
    sendJson(['status' => 'error', 'message' => 'Method not allowed'], 405);
}
?>
