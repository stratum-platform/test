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
function toggleTreeNode(element) {
    const categoryDiv = element.closest('.tree-category');
    const childrenDiv = categoryDiv.querySelector('.tree-children');
    const icon = element.querySelector('.fa-chevron-right');
    
    if (childrenDiv) {
      if (childrenDiv.style.display === 'none') {
        childrenDiv.style.display = 'block';
        icon.style.transform = 'rotate(90deg)';
      } else {
        childrenDiv.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
      }
    }
  }
  
  // Развернуть всё дерево
  document.getElementById('expand-all-tree')?.addEventListener('click', function() {
    const allChildren = document.querySelectorAll('.tree-children');
    const allIcons = document.querySelectorAll('.tree-node .fa-chevron-right');
    
    allChildren.forEach(child => child.style.display = 'block');
    allIcons.forEach(icon => icon.style.transform = 'rotate(90deg)');
    
    this.innerHTML = '<i class="fas fa-compress-alt"></i>';
    setTimeout(() => {
      this.innerHTML = '<i class="fas fa-compress-alt"></i> Свернуть всё';
    }, 100);
  });
  
  // Функция открытия статей категории (симуляция)
  function openCategoryArticles(categoryId) {
    // Убираем активный класс у всех узлов
    document.querySelectorAll('.tree-node').forEach(node => {
      node.classList.remove('active');
    });
    
    // Подсвечиваем выбранный узел (упрощённо - ищем по родителю)
    event.currentTarget.classList.add('active');
    
    // Обновляем заголовок контента
    const categoryName = event.currentTarget.querySelector('span:not(.category-badge)').textContent.trim();
    document.getElementById('content-category-title').textContent = categoryName;
    document.getElementById('content-category-desc').textContent = `Статьи в категории «${categoryName}» отдела Разработка`;
    document.getElementById('current-category-breadcrumb').textContent = categoryName;
    
    // Здесь должна быть загрузка статей через AJAX
    // Для демонстрации просто показываем сообщение
    console.log('Загружаем категорию:', categoryId);
    
    // Симуляция загрузки разных статей
    const container = document.getElementById('articles-container');
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #6c757d;"><i class="fas fa-spinner fa-spin"></i> Загрузка статей...</div>';
    
    setTimeout(() => {
      if (categoryId.includes('procedures')) {
        container.innerHTML = `
          <div class="article-card"><div class="article-header"><div><div class="article-title">Процедура обработки заявок</div><div class="article-meta"><span><i class="far fa-user"></i> Петров А.В.</span></div></div></div><div class="article-excerpt">Полное руководство по обработке входящих заявок от клиентов.</div><div class="article-footer"><div class="article-tags"><span class="tag">процедуры</span></div></div></div>
          <div class="article-card"><div class="article-header"><div><div class="article-title">Процедура code review</div><div class="article-meta"><span><i class="far fa-user"></i> Сидоров И.И.</span></div></div></div><div class="article-excerpt">Как проводить code review: правила, чек-листы и best practices.</div><div class="article-footer"><div class="article-tags"><span class="tag">code review</span></div></div></div>
          <div class="article-card"><div class="article-header"><div><div class="article-title">Процедура онбординга</div><div class="article-meta"><span><i class="far fa-user"></i> Иванова М.С.</span></div></div></div><div class="article-excerpt">Введение в должность для новых сотрудников отдела.</div><div class="article-footer"><div class="article-tags"><span class="tag">онбординг</span></div></div></div>
        `;
      } else {
        container.innerHTML = `
          <div class="article-card"><div class="article-header"><div><div class="article-title">Статьи категории ${categoryName}</div><div class="article-meta"><span><i class="far fa-user"></i> Система</span></div></div></div><div class="article-excerpt">Демонстрационные статьи для выбранной категории.</div><div class="article-footer"><div class="article-tags"><span class="tag">демо</span></div></div></div>
          <div class="article-card"><div class="article-header"><div><div class="article-title">Пример второй статьи</div><div class="article-meta"><span><i class="far fa-user"></i> Тестовый пользователь</span></div></div></div><div class="article-excerpt">Описание функциональности и возможностей.</div><div class="article-footer"><div class="article-tags"><span class="tag">пример</span></div></div></div>
        `;
      }
      // Применяем текущий вид отображения
      applyCurrentView();
    }, 500);
  }
  
  // Переключение вида (плитка/список/компактный)
  document.querySelectorAll('.view-toggle-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.view-toggle-btn').forEach(b => {
        b.classList.remove('active');
        b.style.background = 'transparent';
      });
      this.classList.add('active');
      this.style.background = 'white';
      
      const viewMode = this.dataset.view;
      const container = document.getElementById('articles-container');
      
      // Убираем предыдущие классы
      container.classList.remove('list-view', 'compact-view');
      
      if (viewMode === 'grid') {
        container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
      } else if (viewMode === 'list') {
        container.classList.add('list-view');
        container.style.gridTemplateColumns = '1fr';
      } else if (viewMode === 'compact') {
        container.classList.add('compact-view');
        container.style.gridTemplateColumns = '1fr';
      }
    });
  });
  
  function applyCurrentView() {
    const activeBtn = document.querySelector('.view-toggle-btn.active');
    if (activeBtn) {
      const viewMode = activeBtn.dataset.view;
      const container = document.getElementById('articles-container');
      
      container.classList.remove('list-view', 'compact-view');
      
      if (viewMode === 'grid') {
        container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
      } else if (viewMode === 'list') {
        container.classList.add('list-view');
        container.style.gridTemplateColumns = '1fr';
      } else if (viewMode === 'compact') {
        container.classList.add('compact-view');
        container.style.gridTemplateColumns = '1fr';
      }
    }
  }
  
  // Поиск по категориям
  document.getElementById('category-search')?.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const categories = document.querySelectorAll('.tree-category');
    
    categories.forEach(cat => {
      const catText = cat.textContent.toLowerCase();
      if (catText.includes(searchTerm) || searchTerm === '') {
        cat.style.display = 'block';
        // Если есть совпадение и поиск не пустой - разворачиваем
        if (searchTerm !== '') {
          const children = cat.querySelector('.tree-children');
          const icon = cat.querySelector('.fa-chevron-right');
          if (children) {
            children.style.display = 'block';
            if (icon) icon.style.transform = 'rotate(90deg)';
          }
        }
      } else {
        cat.style.display = 'none';
      }
    });
  });
  
  // Обновление названия отдела в breadcrumb при переключении отдела
  function updateDeptBreadcrumb(deptName) {
    document.getElementById('current-dept-breadcrumb').textContent = deptName;
  }
  
  // Подключаем к существующим кнопкам переключения отделов
  document.querySelectorAll('.dept-switch-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const deptName = this.textContent.trim();
      updateDeptBreadcrumb(deptName);
    });
  });