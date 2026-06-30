<?php
// api/auth.php
require_once 'config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['status' => 'error', 'message' => 'Method not allowed'], 405);
}

// Get action (register or login)
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);
$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? trim($input['password']) : '';

$db = getDB();

if ($action === 'register') {
    if (empty($email) || empty($password)) {
        sendJson(['status' => 'error', 'message' => 'Email and password are required'], 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendJson(['status' => 'error', 'message' => 'Invalid email format'], 400);
    }

    // Check if email exists
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        sendJson(['status' => 'error', 'message' => 'Email already exists'], 400);
    }

    // Hash password and insert user
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $db->prepare("INSERT INTO users (email, password) VALUES (?, ?)");
    try {
        $stmt->execute([$email, $hashedPassword]);
        $userId = $db->lastInsertId();
        
        // Log them in automatically
        $_SESSION['user_id'] = $userId;
        $_SESSION['email'] = $email;
        
        sendJson(['status' => 'success', 'message' => 'Registration successful']);
    } catch (PDOException $e) {
        sendJson(['status' => 'error', 'message' => 'Registration failed'], 500);
    }

} elseif ($action === 'login') {
    if (empty($email) || empty($password)) {
        sendJson(['status' => 'error', 'message' => 'Email and password are required'], 400);
    }
    
    $stmt = $db->prepare("SELECT id, email, password FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        // Password is correct
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['email'] = $user['email'];
        sendJson(['status' => 'success', 'message' => 'Login successful']);
    } else {
        sendJson(['status' => 'error', 'message' => 'Invalid email or password'], 401);
    }

} elseif ($action === 'logout') {
    session_destroy();
    sendJson(['status' => 'success', 'message' => 'Logged out successfully']);
} elseif ($action === 'check') {
    // Check if user is logged in
    if (isset($_SESSION['user_id'])) {
        sendJson(['status' => 'success', 'logged_in' => true, 'email' => $_SESSION['email']]);
    } else {
        sendJson(['status' => 'success', 'logged_in' => false]);
    }
} else {
    sendJson(['status' => 'error', 'message' => 'Invalid action'], 400);
}
?>
