// knowledge.js
document.addEventListener('DOMContentLoaded', () => {
    // =============================================
    // Переменные и элементы
    // =============================================
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.querySelector('.toggle-sidebar-btn');
    const createArticleBtn = document.getElementById('create-article-btn');
    const editorModal = document.getElementById('editor-modal');
    const articleModal = document.getElementById('article-modal');
    const modalCloses = document.querySelectorAll('.modal-close');
    const knowledgeSearch = document.getElementById('knowledge-search');
    const viewButtons = document.querySelectorAll('.view-btn');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const articleAccessSelect = document.getElementById('article-access');
    const enableNotifications = document.getElementById('enable-notifications');
    const toggleFiltersBtn = document.getElementById('toggle-filters-btn');
    const filtersPanel = document.getElementById('filters-panel');

    // Симуляция текущего пользователя (в реальном проекте брать из сессии / API)
    const currentUser = {
        name: "Александр Бобров",
        role: "Администратор"
    };

    // =============================================
    // Сайдбар — сворачивание
    // =============================================
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            document.querySelector('.main-content').style.marginLeft = sidebar.classList.contains('collapsed') ? '80px' : '240px';
        });
    }

    // =============================================
    // Модальные окна — открытие / закрытие
    // =============================================
    modalCloses.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', e => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Открытие редактора новой статьи
    if (createArticleBtn) {
        createArticleBtn.addEventListener('click', () => {
            // Очистка формы
            document.getElementById('article-title').value = '';
            document.getElementById('article-content').value = '';
            document.getElementById('article-tags').value = '';
            document.getElementById('article-access').value = 'Публичная';
            document.getElementById('private-groups').style.display = 'none';
            document.getElementById('enable-notifications').checked = false;
            document.getElementById('notification-options').style.display = 'none';

            editorModal.style.display = 'flex';
        });
    }

    // Открытие статьи (просмотр)
    document.querySelectorAll('.article-card').forEach(card => {
        card.addEventListener('click', () => {
            // Здесь можно загрузить реальное содержимое статьи через API
            articleModal.style.display = 'flex';
        });
    });

    // =============================================
    // Кнопка "Фильтры" — показ/скрытие панели
    // =============================================
    if (toggleFiltersBtn) {
        toggleFiltersBtn.addEventListener('click', () => {
            filtersPanel.classList.toggle('open');
        });
    }

    // =============================================
    // Переключение видов отображения (сетка / список / плитки)
    // =============================================
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const view = btn.dataset.view;
            document.querySelector('.knowledge-main').className = `knowledge-main ${view}`;
            localStorage.setItem('knowledgeView', view);
        });
    });

    // Восстановить сохранённый вид
    const savedView = localStorage.getItem('knowledgeView') || 'grid';
    document.querySelector(`.view-btn[data-view="${savedView}"]`)?.classList.add('active');
    document.querySelector('.knowledge-main').className = `knowledge-main ${savedView}`;

    // =============================================
    // Фильтры
    // =============================================
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', filterArticles);
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            document.querySelectorAll('.filters select').forEach(s => {
                s.selectedIndex = 0;
            });
            document.getElementById('filter-date-from').value = '';
            document.getElementById('filter-date-to').value = '';
            filterArticles();
        });
    }

    function filterArticles() {
        const cards = document.querySelectorAll('.article-card');

        const category = document.getElementById('filter-category').value;
        const sort = document.getElementById('filter-sort').value;
        const status = document.getElementById('filter-status').value;
        const author = document.getElementById('filter-author').value;
        const dateFrom = document.getElementById('filter-date-from').value;
        const dateTo = document.getElementById('filter-date-to').value;
        const selectedTags = Array.from(document.getElementById('filter-tags').selectedOptions).map(o => o.value);
        const access = document.getElementById('filter-access').value.toLowerCase();

        let visibleCount = 0;

        cards.forEach(card => {
            let show = true;

            if (category !== 'Все категории' && card.dataset.category !== category) show = false;
            if (status !== 'Все статусы' && card.dataset.status !== status) show = false;
            if (author !== 'Все авторы' && card.dataset.author !== author) show = false;
            if (access !== 'все' && card.dataset.access !== access) show = false;

            if (dateFrom && card.dataset.date < dateFrom) show = false;
            if (dateTo && card.dataset.date > dateTo) show = false;

            if (selectedTags.length > 0) {
                const cardTags = card.dataset.tags.split(',');
                if (!selectedTags.some(tag => cardTags.includes(tag.trim()))) show = false;
            }

            card.style.display = show ? '' : 'none';
            if (show) visibleCount++;
        });

        // Обновить текст "Показано X из Y"
        document.querySelector('.pagination > div:first-child').textContent = 
            `Показано ${visibleCount} из ${cards.length} статей`;
    }

    // =============================================
    // Приватность статьи
    // =============================================
    if (articleAccessSelect) {
        articleAccessSelect.addEventListener('change', e => {
            document.getElementById('private-groups').style.display = 
                (e.target.value === 'Приватная') ? 'block' : 'none';
        });
    }

    // =============================================
    // Уведомления об обновлении
    // =============================================
    if (enableNotifications) {
        enableNotifications.addEventListener('change', e => {
            document.getElementById('notification-options').style.display = 
                e.target.checked ? 'block' : 'none';
        });
    }

    // =============================================
    // Админ — редактирование глоссария
    // =============================================
    if (currentUser.role === 'Администратор') {
        document.getElementById('glossary-admin-section').style.display = 'block';
    }

    document.getElementById('save-glossary-btn')?.addEventListener('click', () => {
        const jsonText = document.getElementById('glossary-json').value.trim();
        if (!jsonText) return alert('Введите JSON');

        try {
            const parsed = JSON.parse(jsonText);
            console.log('Сохранён новый конфиг глоссария:', parsed);
            // Здесь должен быть fetch на сервер
            alert('Настройки глоссария сохранены (симуляция)');
        } catch (err) {
            alert('Ошибка в формате JSON: ' + err.message);
        }
    });

    // =============================================
    // Интеграция поиска с глоссарием
    // =============================================
    if (knowledgeSearch && window.glossarySystem) {
        knowledgeSearch.addEventListener('input', e => {
            const val = e.target.value.trim();
            if (val.length >= 2) {
                glossarySystem.processSearchInput(val);
            } else {
                glossarySystem.hideSearchSuggestions();
            }
        });
    }

    // =============================================
    // Симуляция сохранения статьи (можно расширить)
    // =============================================
    document.getElementById('publish-article')?.addEventListener('click', () => {
        alert('Статья опубликована (симуляция)');
        editorModal.style.display = 'none';
    });

    document.getElementById('save-draft')?.addEventListener('click', () => {
        alert('Черновик сохранён (симуляция)');
    });
});

// Загрузка текущего глоссария при открытии редактора (симуляция)
document.querySelector('.edit-article-btn')?.addEventListener('click', () => {
  // Здесь можно подгрузить актуальный JSON с сервера
  const exampleConfig = {
    suggestions: {
      "заявка": { quickAnswer: "Заявка — это запрос клиента...", priority: 10 },
      "crm": { quickAnswer: "CRM — система управления клиентами...", links: [{text: "Инструкция", url: "/docs/crm"}] }
    },
    synonyms: { "заявки": ["заявка", "обращение"] }
  };
  document.getElementById('glossary-json').value = JSON.stringify(exampleConfig, null, 2);
});