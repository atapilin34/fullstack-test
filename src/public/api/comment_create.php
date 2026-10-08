<?php
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Метод не разрешен']);
    exit;
}

$author = trim($_POST['author'] ?? '');
$text   = trim($_POST['text'] ?? '');

if (empty($author) || empty($text)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Заполните все поля']);
    exit;
}

require_once __DIR__ . '/../../config/db.php';

try {
    // Подготовленный запрос для защиты от SQL-инъекций
    $sql = "INSERT INTO `comments` (`author`, `text`, `created_at`) VALUES (:author, :text, NOW())";
    $stmt =$pdo->prepare($sql);$stmt->execute([
        ':author' => $author,
        ':text'   => $text
    ]);

    // Получаем ID только что созданной записи
    $newId = (int)$pdo->lastInsertId();

    // Считаем общее количество комментариев
    $totalCount = (int)$pdo->query("SELECT COUNT(id) FROM `comments`")->fetchColumn();

    // Возвращаем данные обратно в JS
    echo json_encode([
        'success'    => true,
        'totalCount' => $totalCount,
        'comment'    => [
            'id'     => $newId,
            'author' => htmlspecialchars($author, ENT_QUOTES, 'UTF-8'),
            'text'   => nl2br(htmlspecialchars($text, ENT_QUOTES, 'UTF-8')),
            'date'   => date('d.m.Y H:i')
        ]
    ]);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Ошибка записи в БД: ' . $e->getMessage()]);
    exit;
}