class GlossarySystem {
    constructor() {
        this.searchConfig = null;
        this.isLoading = false;
        this.settings = {
            showSearchSuggestions: true
        };
        this.searchResultsContainer = null;
        this.loadSettings();
        this.init();
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('glossarySettings');
            if (saved) {
                const parsed = JSON.parse(saved);

                this.settings.showSearchSuggestions = parsed.showSearchSuggestions !== undefined ? parsed.showSearchSuggestions : true;
            }
        } catch (e) {
            console.warn('Failed to load glossary settings', e);
        }
    }
refreshGlossary() {
    console.log('Refreshing glossary for theme change');
    this.hideSearchSuggestions();
    if (this.settings.showSearchSuggestions) {
        setTimeout(() => {
            this.processExistingSearchResults();
        }, 200);
    }
}
    saveSettings() {
        try {
            localStorage.setItem('glossarySettings', JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Failed to save glossary settings', e);
        }
    }

    async init() {
        await this.loadSearchConfig();
        this.setupSearchGlossary();
        this.addSettingsButton();
    }

async loadSearchConfig() {
  // Для теста — встроенный конфиг
  this.searchConfig = {
    suggestions: {
      "заявка": { quickAnswer: "Заявка — это входящий запрос от клиента. Обрабатывается в CRM в разделе 'Заявки'", priority: 10 },
      "Тест": { quickAnswer: "тест — это проверка работает или нет", priority: 10 },
      "отчетность": { quickAnswer: "Отчетность формируется в разделе Аналитика → Отчеты. Доступны ежемесячные, квартальные и по клиентам.", priority: 8 },
      "crm": { quickAnswer: "CRM — центральная система учета клиентов и сделок. Главное меню → Клиенты / Сделки", links: [{text: "Полная инструкция", url: "#"}] },
      "процедура": { quickAnswer: "Процедуры описаны в базе знаний в разделе 'Процедуры'. Самые частые: обработка заявок, возврат товара." }
    },
    synonyms: {
    "тест": ["тестовый", "тес", "те","тес","т","test","tes"],
      "заявки": ["заявка", "обращение", "лид"],
      "отчет": ["отчетность", "отчеты"]
    }
  };
  console.log('Тестовый глоссарий загружен (встроенный)');
}

 addSettingsButton() {
    if (this.settingsButtonAdded) return;

    const searchContainer = document.querySelector('.search-container');
    if (!searchContainer) {
        setTimeout(() => this.addSettingsButton(), 500);
        return;
    }

    if (searchContainer.querySelector('.glossary-settings-btn')) {
        this.settingsButtonAdded = true;
        return;
    }

    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'glossary-settings-btn btn btn-secondary';
    settingsBtn.innerHTML = '⚙️';
    settingsBtn.title = 'Настройки глоссария';
    
    settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showSettingsPanel();
    });

    searchContainer.appendChild(settingsBtn);
    this.settingsButtonAdded = true;
}

    showSettingsPanel() {
        const existingPanel = document.querySelector('.glossary-settings-panel');
        if (existingPanel) {
            existingPanel.remove();
            return;
        }

        const panel = document.createElement('div');
        panel.className = 'glossary-settings-panel';
        panel.style.position = 'absolute';
        panel.style.top = '100%';
        panel.style.right = '0';
        panel.style.background = 'white';
        panel.style.border = '1px solid #ddd';
        panel.style.borderRadius = '6px';
        panel.style.padding = '15px';
        panel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        panel.style.zIndex = '1000';
        panel.innerHTML = `
            <div class="settings-header">
                <h4>Настройки глоссария</h4>
                <button class="settings-close">&times;</button>
            </div>
            <div class="settings-content">
                <label class="settings-checkbox">
                    <input type="checkbox" ${this.settings.showSearchSuggestions ? 'checked' : ''} id="showSearchSuggestions">
                    <span>Показывать быстрые ответы в поиске</span>
                </label>
                <div class="settings-actions">
                    <button class="settings-save btn btn-primary">Сохранить</button>
                </div>
            </div>
        `;

        document.querySelector('.search-container').appendChild(panel);

        panel.querySelector('.settings-close').addEventListener('click', () => {
            panel.remove();
        });

        panel.querySelector('.settings-save').addEventListener('click', () => {
            const newSearchSetting = panel.querySelector('#showSearchSuggestions').checked;
            
            this.settings.showSearchSuggestions = newSearchSetting;
            this.saveSettings();
            
            if (!newSearchSetting) {
                this.hideSearchSuggestions();
            }
            
            this.showNotification('Настройки сохранены');
            panel.remove();
        });

        setTimeout(() => {
            const closeHandler = (e) => {
                if (!panel.contains(e.target) && !e.target.classList.contains('glossary-settings-btn')) {
                    panel.remove();
                    document.removeEventListener('click', closeHandler);
                }
            };
            document.addEventListener('click', closeHandler);
        }, 100);
    }

    setupSearchGlossary() {
        this.initializeSearchInput();
        
        this.setupResultsObserver();
    }

    setupResultsObserver() {
        // Убрали, так как нет betterdocs, используем прямую обработку input
    }

    initializeSearchInput() {
        const searchInput = document.getElementById('knowledge-search');
        if (!searchInput || searchInput.hasAttribute('data-glossary-initialized')) return;

        searchInput.setAttribute('data-glossary-initialized', 'true');

        let lastValue = '';
        let inputTimeout = null;
        
        searchInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            if (value === lastValue) return;
            
            lastValue = value;
            
            clearTimeout(inputTimeout);
            inputTimeout = setTimeout(() => {
                if (value.length >= 2) {
                    this.processSearchInput(value);
                } else {
                    this.hideSearchSuggestions();
                }
            }, 300);
        });

        searchInput.addEventListener('focus', () => {
            const value = searchInput.value.trim();
            if (value.length >= 2) {
                this.processSearchInput(value);
            }
        });

        searchInput.addEventListener('blur', () => {
            setTimeout(() => this.hideSearchSuggestions(), 200);
        });
    }

    processExistingSearchResults() {
        // Убрали, не нужно
    }

    processSearchInput(searchText) {
        if (!this.searchConfig || this.isLoading || !this.settings.showSearchSuggestions) return;

        const container = this.getSearchResultsContainer();

        const bestMatch = this.findBestMatch(searchText);
        
        if (bestMatch) {
            this.showSingleSuggestion(bestMatch, container, searchText);
        } else {
            this.hideSearchSuggestions();
        }
    }

    getSearchResultsContainer() {
        if (!this.searchResultsContainer) {
            this.searchResultsContainer = document.createElement('div');
            this.searchResultsContainer.id = 'knowledge-search-results';
            this.searchResultsContainer.style.position = 'absolute';
            this.searchResultsContainer.style.top = '100%';
            this.searchResultsContainer.style.left = '0';
            this.searchResultsContainer.style.width = '100%';
            this.searchResultsContainer.style.background = 'white';
            this.searchResultsContainer.style.border = '1px solid #ddd';
            this.searchResultsContainer.style.borderRadius = '6px';
            this.searchResultsContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            this.searchResultsContainer.style.zIndex = '1000';
            this.searchResultsContainer.style.padding = '10px';
            this.searchResultsContainer.style.maxHeight = '300px';
            this.searchResultsContainer.style.overflowY = 'auto';
            document.querySelector('.search-box').appendChild(this.searchResultsContainer);
        }
        return this.searchResultsContainer;
    }

findBestMatch(searchText) {
    let bestMatch = null;
    let bestScore = 0;
    const synonyms = this.searchConfig.synonyms || {};

    Object.entries(this.searchConfig.suggestions || {}).forEach(([key, data]) => {
        const score = this.calculateMatchScore(searchText, key, synonyms, data.priority || 0);
        
        if (searchText.includes('отчетность')) {
            console.log(`🔍 "${key}": score = ${score.toFixed(2)}`);
        }
        
        if (score > bestScore) {
            bestScore = score;
            bestMatch = { key, data, matchType: 'suggestion', score };
        }
    });

    if (searchText.includes('отчетность') && bestMatch) {
        console.log(`🎯 Выбран: "${bestMatch.key}" с score = ${bestMatch.score.toFixed(2)}`);
    }

    return bestScore >= 0.3 ? bestMatch : null;
}

    
calculateMatchScore(searchText, targetText, synonyms, basePriority) {
    const cleanSearch = searchText.toLowerCase().trim();
    const cleanTarget = targetText.toLowerCase().trim();
    
const stopWords = [
    'настройка', 'настройки', 'настроек', 'настройку', 'настройке',
    'справка', 'справки', 'справок', 'справку', 'справке',
    'помощь', 'помощи', 'помощью',
    'вопрос', 'вопроса', 'вопросу', 'вопросы',
    'ответ', 'ответа', 'ответу', 'ответы',
    'как', 'что', 'где', 'когда', 'почему', 'зачем'
];
    
    let score = 0;

    if (cleanSearch === cleanTarget) {
        return 5.0 + (basePriority / 10) * 0.1;
    }
    
    if (cleanTarget.includes(cleanSearch)) {
        score += 3.0;
    }
    
    if (cleanSearch.includes(cleanTarget)) {
        score += 2.5;
    }
    
    const searchWords = cleanSearch.split(/\s+/).filter(word => {
        return word.length > 1 && !stopWords.includes(word);
    });
    
    const targetWords = cleanTarget.split(/\s+/).filter(word => {

        return word.length > 1 && !stopWords.includes(word);
    });

    if (searchWords.length === 0 || targetWords.length === 0) {
        return 0.1;
    }
    
    let matchedWords = 0;
    let totalWordScore = 0;
    
    searchWords.forEach(searchWord => {

        if (stopWords.includes(searchWord)) return;

        if (targetWords.some(targetWord => targetWord === searchWord)) {
            matchedWords++;
            totalWordScore += 2.0; 
        }

        else if (targetWords.some(targetWord => targetWord.includes(searchWord))) {
            matchedWords++;
            totalWordScore += 1.0; 
        }

        else if (targetWords.some(targetWord => targetWord.startsWith(searchWord))) {
            matchedWords++;
            totalWordScore += 1.2; 
        }
    });
    
    if (matchedWords > 0) {
        const wordMatchRatio = matchedWords / searchWords.length;
        score += totalWordScore * wordMatchRatio;
    }
    
    if (cleanTarget.includes(cleanSearch) && cleanSearch.length > 3) {
        score += 1.0;
    }
    

    const targetSynonyms = synonyms[targetText] || [];
    if (targetSynonyms.some(synonym => cleanSearch.includes(synonym))) {
        score += 0.2;
    }
    
    score += (basePriority / 10) * 0.1;

    if (matchedWords === searchWords.length && searchWords.length > 0) {
        score += 1.5;
    }

    const allSearchWords = cleanSearch.split(/\s+/);
    const stopWordsCount = allSearchWords.filter(word => stopWords.includes(word)).length;
    const stopWordsRatio = stopWordsCount / allSearchWords.length;
    
    if (stopWordsRatio > 0.5) {
        score *= (1 - stopWordsRatio); 
    }
    
    return score;
}

    showSingleSuggestion(match, container, searchText) {
        let suggestionsContainer = container.querySelector('.glossary-suggestions');
        
        if (!suggestionsContainer) {
            suggestionsContainer = document.createElement('div');
            suggestionsContainer.className = 'glossary-suggestions';
            container.appendChild(suggestionsContainer);
        }

        suggestionsContainer.innerHTML = this.createSingleSuggestionHTML(match, searchText);
        suggestionsContainer.style.display = 'block';
        
        this.setupSuggestionHandlers(suggestionsContainer);
    }

    createSingleSuggestionHTML(match, searchText) {
        const { key, data, matchType } = match;
        const badgeText = 'Быстрый ответ';
        const badgeClass = 'suggestion-badge answer';
        
        return `
            <div class="glossary-suggestion-card single-suggestion" data-key="${key}">
                <div class="suggestion-header">
                    <h4 class="suggestion-title">${this.highlightText(key, searchText)}</h4>
                    <span class="${badgeClass}">${badgeText}</span>
                </div>
                <div class="suggestion-answer">
                    <p>${data.quickAnswer}</p>
                </div>
                ${data.links && data.links.length > 0 ? `
                    <div class="suggestion-links">
                        <div class="suggestion-links-container">
                            ${data.links.map(link => 
                                `<a href="${link.url}" class="suggestion-link" target="_blank">${link.text}</a>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}
                <div class="suggestion-actions">
                    <button class="copy-suggestion" data-text="${data.quickAnswer}">📋 Копировать</button>
                </div>
            </div>
        `;
    }

    highlightText(text, searchText) {
        if (!searchText || searchText.length < 2) return text;
        const regex = new RegExp(`(${this.escapeRegex(searchText)})`, 'gi');
        return text.replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    setupSuggestionHandlers(container) {
        container.querySelectorAll('.copy-suggestion').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const text = e.target.getAttribute('data-text');
                navigator.clipboard.writeText(text).then(() => {
                    this.showNotification('Ответ скопирован');
                });
            });
        });

        container.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    hideSearchSuggestions() {
        if (this.searchResultsContainer) {
            this.searchResultsContainer.innerHTML = '';
            this.searchResultsContainer.style.display = 'none';
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'glossary-notification';
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.background = '#4caf50';
        notification.style.color = 'white';
        notification.style.padding = '12px 24px';
        notification.style.borderRadius = '6px';
        notification.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 2000);
    }
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.glossarySystem = new GlossarySystem();
        }, 1000);
    });
} else {
    setTimeout(() => {
        window.glossarySystem = new GlossarySystem();
    }, 1000);
}