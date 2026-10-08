<?php
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../config/db.php';

try {
    $limit = 3; // Количество комментариев на страницу

    // 1. Белый список параметров сортировки
    $allowedSortFields = ['id', 'created_at'];$allowedOrders     = ['asc', 'desc'];

    // Считываем параметры из GET (по умолчанию: по дате, сначала новые)
    $sortField =$_GET['sort'] ?? 'created_at';
    $order     = strtolower($_GET['order'] ?? 'desc');

    if (!in_array($sortField, $allowedSortFields, true)) {$sortField = 'created_at';
    }
    if (!in_array($order, $allowedOrders, true)) {$order = 'desc';
    }

    // 2. Считаем общее число записей
    $totalCount = (int)$pdo->query("SELECT COUNT(*) FROM `comments`")->fetchColumn();
    $totalPages = (int)ceil($totalCount / $limit);
    if ($totalPages < 1) {$totalPages = 1;
    }

    // 3. Определяем текущую страницу из GET-параметра
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    if ($page < 1)$page = 1;
    if ($page >$totalPages) $page =$totalPages;

    $offset = ($page - 1) *$limit;

    // 4. Подставляем проверенные переменные в ORDER BY
    $sql = "SELECT `id`, `author`, `text`, DATE_FORMAT(`created_at`, '%d.%m.%Y %H:%i') AS `date` 
            FROM `comments` 
            ORDER BY `{$sortField}` {$order} 
            LIMIT :limit OFFSET :offset";
            
    $stmt =$pdo->prepare($sql);$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);$stmt->execute();
    $rawComments =$stmt->fetchAll(PDO::FETCH_ASSOC);

    $comments = [];
    foreach ($rawComments as $row) {$comments[] = [
            'id'     => (int)$row['id'],
            'author' => htmlspecialchars($row['author'], ENT_QUOTES, 'UTF-8'),
            'text'   => nl2br(htmlspecialchars($row['text'], ENT_QUOTES, 'UTF-8')),             'date'   =>$row['date']
        ];
    }

    // 5. Отдаем данные вместе с пагинацией
    echo json_encode([
        'success'     => true,
        'comments'    => $comments,
        'pagination'  => [
            'currentPage' => $page,
            'totalPages'  => $totalPages,
            'totalCount'  => $totalCount
        ]
    ]);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Ошибка базы данных: ' . $e->getMessage()]);
    exit;
}