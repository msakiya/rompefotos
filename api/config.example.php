<?php
// api/config.php
session_start();

define('DB_HOST', 'localhost');
define('DB_USER', 'your_db_user'); // Assuming user is the same as DB name, adjust if necessary
define('DB_PASS', 'your_db_password');
define('DB_NAME', 'your_db_user');

// Global Exception Handler to always return JSON
set_exception_handler(function($e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    exit;
});

// Function to get database connection
function getDB() {
    try {
        $dbConnection = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
        $dbConnection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        // Set fetch mode to associative array
        $dbConnection->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $dbConnection;
    } catch (PDOException $e) {
        // Log error in production, but for now we just return error JSON
        die(json_encode(['status' => 'error', 'message' => 'Connection failed: ' . $e->getMessage()]));
    }
}

// Helper function to send JSON response
function sendJson($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    // Prevent aggressive caching from shared hosting (like Dreamhost Varnish)
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Cache-Control: post-check=0, pre-check=0', false);
    header('Pragma: no-cache');
    
    // Ensure session is written to disk before finishing
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_write_close();
    }
    
    echo json_encode($data);
    exit;
}

// Check if user is logged in
function requireLogin() {
    if (!isset($_SESSION['user_id'])) {
        sendJson(['status' => 'error', 'message' => 'Unauthorized'], 401);
    }
}
?>
