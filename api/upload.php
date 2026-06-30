<?php
// api/upload.php
require_once 'config.php';
requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['status' => 'error', 'message' => 'Method not allowed'], 405);
}

// Check if file was uploaded without errors
if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = '../uploads/';
    
    // Ensure upload directory exists
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $fileTmpPath = $_FILES['photo']['tmp_name'];
    $fileName = $_FILES['photo']['name'];
    $fileSize = $_FILES['photo']['size'];
    $fileType = $_FILES['photo']['type'];
    
    // Get file extension
    $fileNameCmps = explode(".", $fileName);
    $fileExtension = strtolower(end($fileNameCmps));
    
    // Allowed extensions
    $allowedfileExtensions = array('jpg', 'gif', 'png', 'jpeg', 'webp');
    
    if (in_array($fileExtension, $allowedfileExtensions)) {
        // Create unique filename
        $newFileName = md5(time() . $fileName) . '.' . $fileExtension;
        $dest_path = $uploadDir . $newFileName;
        
        if (move_uploaded_file($fileTmpPath, $dest_path)) {
            // Save to database
            $db = getDB();
            $stmt = $db->prepare("INSERT INTO photos (user_id, filename) VALUES (?, ?)");
            try {
                $stmt->execute([$_SESSION['user_id'], $newFileName]);
                $photoId = $db->lastInsertId();
                sendJson([
                    'status' => 'success', 
                    'message' => 'File uploaded successfully',
                    'photo' => [
                        'id' => $photoId,
                        'filename' => $newFileName,
                        'url' => 'uploads/' . $newFileName
                    ]
                ]);
            } catch (PDOException $e) {
                // Remove file if DB insert fails
                unlink($dest_path);
                sendJson(['status' => 'error', 'message' => 'Database error'], 500);
            }
        } else {
            sendJson(['status' => 'error', 'message' => 'Error moving the uploaded file'], 500);
        }
    } else {
        sendJson(['status' => 'error', 'message' => 'Upload failed. Allowed file types: ' . implode(',', $allowedfileExtensions)], 400);
    }
} else {
    // Handle specific upload errors
    $errorMessage = 'No file uploaded or upload error occurred.';
    if(isset($_FILES['photo']['error'])) {
       $errorMessage .= ' Error code: ' . $_FILES['photo']['error'];
    }
    sendJson(['status' => 'error', 'message' => $errorMessage], 400);
}
?>
