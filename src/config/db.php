<?php
// db.php
$host = 'db';
$db   = 'codeigniter_db'; // Имя вашей БД
$user = 'root';        // Логин
$pass = 'cod31gn1t3';            // Пароль
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Ошибки выбрасываются как исключения
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Ответ в виде ассоциативного массива
    PDO::ATTR_EMULATE_PREPARES   => false,                  // Реальные prepared statements
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Ошибка подключения к базе данных']);
    exit;
}