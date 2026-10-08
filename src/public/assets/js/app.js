document.addEventListener('DOMContentLoaded', () => {
    const API = {
        list: '/api/comment_list.php',
        create: '/api/comment_create.php',
        delete: '/api/comment_delete.php',
    };

    const form = document.getElementById('commentForm');
    const commentsList = document.querySelector('.comments-list');
    const paginationContainer = document.getElementById('pagination');
    const commentsCount = document.getElementById('commentsCount');

    const sortFieldSelect = document.getElementById('sortField');
    const sortOrderSelect = document.getElementById('sortOrder');

    const emailInput = document.getElementById('emailInput');
    const emailError = document.getElementById('emailError');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const commentsPerPage = 3;

    let currentPage = 1;

    function setEmailError(message = '') {
        if (!emailInput) {
            return;
        }

        const hasError = message.length > 0;

        emailInput.classList.toggle('invalid', hasError);

        if (emailError) {
            emailError.textContent = message;
            emailError.classList.toggle('visible', hasError);
        }
    }

    function validateEmail() {
        if (!emailInput) {
            return true;
        }

        const email = emailInput.value.trim();

        if (email === '') {
            setEmailError('Введите адрес электронной почты');
            return false;
        }

        if (!emailRegex.test(email)) {
            setEmailError('Некорректный формат email (пример: user@mail.ru)');
            return false;
        }

        setEmailError();
        return true;
    }

    async function getJson(response) {
        const contentType = response.headers.get('content-type') || '';
        const text = await response.text();

        if (!text) {
            return {};
        }

        if (!contentType.includes('application/json')) {
            throw new Error(
                `Сервер вернул не JSON. HTTP ${response.status}: ${text.slice(0, 300)}`
            );
        }

        try {
            return JSON.parse(text);
        } catch {
            throw new Error(
                `Сервер вернул некорректный JSON. HTTP ${response.status}: ${text.slice(0, 300)}`
            );
        }
    }

    async function requestJson(url, options = {}) {
        const response = await fetch(url, {
            headers: {
                Accept: 'application/json',
                ...(options.headers || {}),
            },
            ...options,
        });

        const data = await getJson(response);

        if (!response.ok || data.success === false) {
            throw new Error(
                data.error || `Ошибка запроса: HTTP ${response.status}`
            );
        }

        return data;
    }

    function escapeHtml(value) {
        const element = document.createElement('div');
        element.textContent = String(value ?? '');
        return element.innerHTML;
    }

    function createCommentHTML(comment) {
        const author = String(comment.author ?? '').trim();
        const text = String(comment.text ?? '');
        const date = String(comment.date ?? '');
        const id = Number(comment.id);

        const initial = author.charAt(0).toUpperCase() || '?';

        return `
            <article class="comment-card" data-comment-id="${id}">
                <div class="avatar">${escapeHtml(initial)}</div>

                <div class="comment-body">
                    <div class="comment-header">
                        <div class="comment-meta">
                            <strong>${escapeHtml(author || 'Без имени')}</strong>
                            <span class="date">${escapeHtml(date)}</span>
                        </div>

                        <button
                            type="button"
                            class="del-btn"
                            data-id="${id}"
                            title="Удалить комментарий"
                            aria-label="Удалить комментарий"
                        >
                            &times;
                        </button>
                    </div>

                    <p class="comment-text">${escapeHtml(text)}</p>
                </div>
            </article>
        `;
    }

    function renderPagination(totalPages, activePage) {
        if (!paginationContainer) {
            return;
        }

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        const buttons = [];

        for (let page = 1; page <= totalPages; page += 1) {
            const isActive = page === activePage;

            buttons.push(`
                <button
                    type="button"
                    class="page-btn${isActive ? ' active' : ''}"
                    data-page="${page}"
                    ${isActive ? 'aria-current="page"' : ''}
                >
                    ${page}
                </button>
            `);
        }

        paginationContainer.innerHTML = buttons.join('');
    }

    async function loadComments(page = 1) {
        if (!commentsList) {
            return;
        }

        const sort = sortFieldSelect?.value || 'created_at';
        const order = sortOrderSelect?.value || 'desc';

        const params = new URLSearchParams({
            page: String(page),
            sort,
            order,
        });

        commentsList.classList.add('is-loading');

        try {
            const data = await requestJson(`${API.list}?${params}`);

            const pagination = data.pagination || {};
            const comments = Array.isArray(data.comments) ? data.comments : [];

            currentPage = Number(pagination.currentPage) || 1;

            if (commentsCount) {
                commentsCount.textContent = `Всего: ${Number(pagination.totalCount) || 0}`;
            }

            if (comments.length === 0) {
                commentsList.innerHTML = `
                    <p class="empty">Комментариев пока нет</p>
                `;
            } else {
                commentsList.innerHTML = comments.map(createCommentHTML).join('');
            }

            renderPagination(
                Number(pagination.totalPages) || 0,
                currentPage
            );
        } catch (error) {
            console.error('Ошибка загрузки комментариев:', error);

            commentsList.innerHTML = `
                <p class="empty">
                    Ошибка загрузки комментариев: ${escapeHtml(error.message)}
                </p>
            `;

            if (commentsCount) {
                commentsCount.textContent = '';
            }

            if (paginationContainer) {
                paginationContainer.innerHTML = '';
            }
        } finally {
            commentsList.classList.remove('is-loading');
        }
    }

    async function deleteComment(id, button) {
        const data = await requestJson(API.delete, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: Number(id),
            }),
        });

        const visibleComments = commentsList
            ? commentsList.querySelectorAll('.comment-card').length
            : 0;

        if (visibleComments === 1 && currentPage > 1) {
            currentPage -= 1;
        }

        await loadComments(currentPage);

        return data;
    }

    async function createComment(formData) {
        return requestJson(API.create, {
            method: 'POST',
            body: formData,
        });
    }

    if (emailInput) {
        emailInput.addEventListener('input', validateEmail);
        emailInput.addEventListener('blur', validateEmail);
    }

    function handleSortChange() {
        currentPage = 1;
        loadComments(1);
    }

    if (sortFieldSelect) {
        sortFieldSelect.addEventListener('change', handleSortChange);
    }

    if (sortOrderSelect) {
        sortOrderSelect.addEventListener('change', handleSortChange);
    }

    if (paginationContainer) {
        paginationContainer.addEventListener('click', (event) => {
            const button = event.target.closest('.page-btn');

            if (!button) {
                return;
            }

            const page = Number(button.dataset.page);

            if (Number.isInteger(page) && page > 0 && page !== currentPage) {
                loadComments(page);
            }
        });
    }

    if (commentsList) {
        commentsList.addEventListener('click', async (event) => {
            const deleteButton = event.target.closest('.del-btn');

            if (!deleteButton) {
                return;
            }

            const commentId = Number(deleteButton.dataset.id);

            if (!Number.isInteger(commentId) || commentId <= 0) {
                alert('Некорректный идентификатор комментария');
                return;
            }

            if (!confirm('Вы действительно хотите удалить этот комментарий?')) {
                return;
            }

            deleteButton.disabled = true;

            try {
                await deleteComment(commentId, deleteButton);
            } catch (error) {
                console.error('Ошибка удаления комментария:', error);
                alert(`Ошибка удаления: ${error.message}`);
                deleteButton.disabled = false;
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (!validateEmail()) {
                emailInput?.focus();
                return;
            }

            const submitButton = form.querySelector('button[type="submit"]');

            if (!submitButton) {
                console.error('В форме не найдена кнопка type="submit"');
                return;
            }

            const defaultButtonText = submitButton.textContent;
            const formData = new FormData(form);

            try {
                submitButton.disabled = true;
                submitButton.textContent = 'Отправка...';

                const data = await createComment(formData);

                form.reset();
                setEmailError();

                const order = sortOrderSelect?.value || 'desc';

                let targetPage = 1;

                if (order === 'asc') {
                    const totalCount = Number(data.totalCount) || 0;
                    targetPage = Math.max(
                        1,
                        Math.ceil(totalCount / commentsPerPage)
                    );
                }

                await loadComments(targetPage);

                commentsList?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            } catch (error) {
                console.error('Ошибка создания комментария:', error);

                alert(`Ошибка отправки: ${error.message}`);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = defaultButtonText;
            }
        });
    }

    loadComments(1);
});