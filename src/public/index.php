<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Система комментариев</title>
  <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>

  <div class="container">
    <header>
      <h1>Обсуждение проекта</h1>
    </header>
    <!-- Контейнер для сортировки -->
    <div class="sorting-bar">
        <label for="sortField">Сортировать по:</label>
        <select id="sortField">
            <option value="created_at" selected>Дате добавления</option>
            <option value="id">ID</option>
        </select>

        <label for="sortOrder">Порядок:</label>
        <select id="sortOrder">
            <option value="desc" selected>По убыванию</option>
            <option value="asc">По возрастанию</option>
        </select>
    </div>

    <!-- Контейнер для списка комментариев -->
    <div class="comments-list"></div>

    <!-- Контейнер пагинации (кнопки страниц) -->
    <nav class="pagination" id="pagination"></nav>

    <!-- Форма добавления (расположена ПОД комментариями) -->
    <section class="form-section">
      <h2 class="form-title">Оставить комментарий</h2>
      
    <form id="commentForm" novalidate>
    <div class="form-group">
        <label for="emailInput">Email</label>
        <input 
        type="email" 
        id="emailInput" 
        name="author" 
        placeholder="name@example.com" 
        required 
        maxlength="100"
        >
        <span class="error-message" id="emailError"></span>
    </div>

    <div class="form-group">
        <label for="text">Комментарий</label>
        <textarea id="text" name="text" placeholder="Ваше сообщение..." required maxlength="1000"></textarea>
    </div>

    <button type="submit" class="submit-btn">Отправить</button>
    </form>
    </section>
  </div>

  <script src="/assets/js/app.js"></script>
</body>
</html>