<?php

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../config/db.php';

$raw = file_get_contents('php://input');$data = json_decode($raw, true) ?:$_POST;
$id = isset($data['id']) ? (int)$data['id'] : 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Не указан ID']);
    exit;
}

try {
    $stmt =$pdo->prepare("DELETE FROM `comments` WHERE `id` = :id");
    $stmt->execute([':id' =>$id]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}