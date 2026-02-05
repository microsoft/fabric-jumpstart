const FILTER_LABELS = { type: 'Type', workload: 'Workload', scenario: 'Scenario' };

window.jumpstartFilters = {
    activeView: 'workload',
    values: { type: null, workload: null, scenario: null },
    active: []
};
window.jumpstartData = window.jumpstartData || [];

function initJumpstartUI() {
    // Initialize all filters as active by default
    window.jumpstartFilters.active = ['workload', 'scenario', 'type'];
    window.jumpstartFilters.values = { workload: null, scenario: null, type: null };
    
    // Initialize data
    collectData();
    
    // Render initial state
    renderFilters();
    renderFilterMenu();
}

function getJumpstartRoot() {
    const containers = document.querySelectorAll('.jumpstart-container');
    return containers.length ? containers[containers.length - 1] : null;
}

function collectData() {
    const container = getJumpstartRoot();
    if (!container) {
        console.warn('No jumpstart container found');
        return;
    }
    const cards = container.querySelectorAll('.jumpstart-card');
    window.jumpstartData = Array.from(cards).map(card => ({
        type: card.dataset.type || '',
        workloads: (card.dataset.workloads || '').split('|').filter(Boolean),
        scenarios: (card.dataset.scenarios || '').split('|').filter(Boolean),
    }));
    console.log('Collected data:', window.jumpstartData.length, 'cards');
}

function getAvailableOptions(kind) {
    const data = window.jumpstartData || [];
    const filters = window.jumpstartFilters.values;

    // Deduplicate data by creating unique entries based on type+workloads+scenarios
    const seen = new Set();
    const uniqueData = data.filter(item => {
        const key = item.type + '|' + item.workloads.join(',') + '|' + item.scenarios.join(',');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    const filtered = uniqueData.filter(item => {
        // Apply all active filters EXCEPT the one we're computing options for
        if (kind !== 'type' && filters.type && item.type !== filters.type) return false;
        if (kind !== 'workload' && filters.workload && !item.workloads.includes(filters.workload)) return false;
        if (kind !== 'scenario' && filters.scenario && !item.scenarios.includes(filters.scenario)) return false;
        return true;
    });

    let values = [];
    if (kind === 'type') {
        values = filtered.map(i => i.type);
    } else if (kind === 'workload') {
        values = filtered.flatMap(i => i.workloads);
    } else if (kind === 'scenario') {
        values = filtered.flatMap(i => i.scenarios);
    }
    return Array.from(new Set(values.filter(Boolean))).sort();
}

function toggleView(viewType, clickedButton) {
    window.jumpstartFilters.activeView = viewType;

    document.querySelectorAll('.view-container').forEach(el => el.classList.remove('active'));
    const viewEl = document.getElementById(viewType + '-view');
    if (viewEl) {
        viewEl.classList.add('active');
    }

    // Re-apply filters when view changes
    applyFilters();

    document.querySelectorAll('.toggle-group button').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
    });
    if (clickedButton) {
        clickedButton.classList.add('active');
        clickedButton.setAttribute('aria-pressed', 'true');
    } else {
        const activeBtn = document.querySelector('.toggle-group button[data-view="' + viewType + '"]');
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.setAttribute('aria-pressed', 'true');
        }
    }

}

function toggleFilterMenu() {
    const menu = document.getElementById('filter-menu');
    const addBtn = document.getElementById('add-filter-btn');
    
    if (!menu || !addBtn) {
        console.error('Filter menu or add button not found');
        return;
    }
    
    const isOpen = menu.dataset.open === 'true';
    menu.dataset.open = isOpen ? 'false' : 'true';
    menu.style.display = menu.dataset.open === 'true' ? 'block' : 'none';
    addBtn.setAttribute('aria-expanded', menu.dataset.open);
    
    console.log('Menu toggled, open:', menu.dataset.open); // Debug log
    
    // Ensure data is collected
    if (!window.jumpstartData || !window.jumpstartData.length) {
        collectData();
    }
    
    renderFilterMenu();
}

function closeFilterMenu() {
    const menu = document.getElementById('filter-menu');
    const addBtn = document.getElementById('add-filter-btn');
    if (menu) {
        menu.dataset.open = 'false';
        menu.style.display = 'none';
    }
    if (addBtn) {
        addBtn.setAttribute('aria-expanded', 'false');
    }
}

function addFilter(kind) {
    if (!window.jumpstartFilters.active.includes(kind)) {
        window.jumpstartFilters.active.push(kind);
    }
    const options = getAvailableOptions(kind);
    window.jumpstartFilters.values[kind] = null; // Start with "- All -"
    renderFilters();
    applyFilters();
    closeFilterMenu();
}

function removeFilter(kind) {
    window.jumpstartFilters.active = window.jumpstartFilters.active.filter(k => k !== kind);
    window.jumpstartFilters.values[kind] = null;
    renderFilters();
    applyFilters();
}

function updateFilter(kind, value) {
    window.jumpstartFilters.values[kind] = (value === '' || !value) ? null : value;
    renderFilters();
    applyFilters();
}

function renderFilterMenu() {
    const menu = document.getElementById('filter-menu');
    const addBtn = document.getElementById('add-filter-btn');
    if (!menu) return;
    
    menu.innerHTML = '';
    const remaining = ['type','workload','scenario'].filter(k => !window.jumpstartFilters.active.includes(k));
    let added = 0;
    
    remaining.forEach(kind => {
        const opts = getAvailableOptions(kind);
        if (!opts.length) {
            return;
        }
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'filter-menu-btn';
        btn.textContent = FILTER_LABELS[kind];
        btn.onclick = () => addFilter(kind);
        menu.appendChild(btn);
        added += 1;
    });
    
    if (added === 0) {
        const empty = document.createElement('div');
        empty.className = 'filter-menu-empty';
        empty.textContent = 'No filters available';
        menu.appendChild(empty);
    }
    
    // Grey out button when all filters are added
    if (addBtn) {
        const allFiltersAdded = remaining.length === 0 || added === 0;
        if (allFiltersAdded) {
            addBtn.disabled = true;
            addBtn.setAttribute('aria-disabled', 'true');
            addBtn.style.cursor = 'not-allowed';
            addBtn.style.opacity = '0.5';
        } else {
            addBtn.disabled = false;
            addBtn.removeAttribute('aria-disabled');
            addBtn.style.cursor = 'pointer';
            addBtn.style.opacity = '1';
        }
    }
    
    menu.style.display = menu.dataset.open === 'true' ? 'block' : 'none';
    if (addBtn) {
        addBtn.setAttribute('aria-expanded', menu.dataset.open === 'true' ? 'true' : 'false');
    }
}

function renderFilters() {
    const container = document.getElementById('active-filters');
    if (!container) return;
    
    container.innerHTML = '';
    window.jumpstartFilters.active.forEach(kind => {
        const wrap = document.createElement('div');
        wrap.className = 'filter-chip';
        wrap.dataset.kind = kind;

        const label = document.createElement('span');
        label.className = 'filter-chip-label';
        label.textContent = FILTER_LABELS[kind];
        wrap.appendChild(label);

        const select = document.createElement('select');
        select.className = 'filter-select';
        select.onchange = (e) => updateFilter(kind, e.target.value);

        const options = getAvailableOptions(kind);
        if (window.jumpstartFilters.values[kind] && !options.includes(window.jumpstartFilters.values[kind])) {
            window.jumpstartFilters.values[kind] = null;
        }
        if (!options.length) {
            const emptyOpt = document.createElement('option');
            emptyOpt.value = '';
            emptyOpt.textContent = 'No options';
            select.appendChild(emptyOpt);
            select.disabled = true;
        } else {
            // Add "- All -" option first
            const allOpt = document.createElement('option');
            allOpt.value = '';
            allOpt.textContent = '- All -';
            if (!window.jumpstartFilters.values[kind]) {
                allOpt.selected = true;
            }
            select.appendChild(allOpt);
            
            options.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt;
                o.textContent = opt;
                if (window.jumpstartFilters.values[kind] === opt) {
                    o.selected = true;
                }
                select.appendChild(o);
            });
            select.disabled = false;
        }
        wrap.appendChild(select);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'filter-chip-remove';
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => removeFilter(kind);
        wrap.appendChild(removeBtn);

        container.appendChild(wrap);
    });
    renderFilterMenu();
}

function applyFilters() {
    const viewType = window.jumpstartFilters.activeView || 'workload';
    const filters = window.jumpstartFilters.values;
    const view = document.getElementById(viewType + '-view');
    if (!view) return;

    let anyVisible = false;

    const sections = view.querySelectorAll('.category-section');
    sections.forEach(section => {
        section.classList.remove('hidden');

        const category = section.dataset.category || '';
        const categoryFilter = filters[viewType];
        const categoryMatches = !categoryFilter || category === categoryFilter;

        // When the active view has the same dimension as the filter (e.g., workload view with a workload filter),
        // hide entire category sections that do not match to avoid showing unrelated groups.
        if (!categoryMatches) {
            section.classList.add('hidden');
            section.querySelectorAll('.jumpstart-card').forEach(card => {
                card.style.display = 'none';
            });
            return;
        }

        let visibleCards = 0;

        section.querySelectorAll('.jumpstart-card').forEach(card => {
            const cardType = card.dataset.type || '';
            const workloads = (card.dataset.workloads || '').split('|').filter(Boolean);
            const scenarios = (card.dataset.scenarios || '').split('|').filter(Boolean);
            const matchesType = !filters.type || filters.type === cardType;
            const matchesWorkload = !filters.workload || workloads.includes(filters.workload);
            const matchesScenario = !filters.scenario || scenarios.includes(filters.scenario);
            const cardVisible = matchesType && matchesWorkload && matchesScenario;
            card.style.display = cardVisible ? '' : 'none';
            if (cardVisible) {
                visibleCards += 1;
            }
        });

        const hideSection = visibleCards === 0;
        section.classList.toggle('hidden', hideSection);
        if (!hideSection) {
            anyVisible = true;
        }
    });

    const container = getJumpstartRoot();
    let notice = container ? container.querySelector('.empty-notice') : null;
    if (!anyVisible) {
        if (!notice && container) {
            notice = document.createElement('div');
            notice.className = 'empty-notice';
            notice.textContent = 'No jumpstarts match the current filters.';
            container.appendChild(notice);
        }
        if (notice) {
            notice.style.display = 'block';
        }
    } else if (notice) {
        notice.style.display = 'none';
    }
}

function copyToClipboard(button) {
    const text = button.getAttribute('data-code');
    if (!button.dataset.originalContent) {
        button.dataset.originalContent = button.innerHTML;
    }

    const copyText = () => {
        return new Promise((resolve, reject) => {
            try {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                const ok = document.execCommand('copy');
                document.body.removeChild(textarea);
                if (ok) {
                    resolve();
                } else {
                    reject(new Error('execCommand returned false'));
                }
            } catch (err) {
                reject(err);
            }
        });
    };

    copyText().then(() => {
        button.classList.add('copied');
        button.innerHTML = '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M14.431 3.323l-8.47 10-.79-.036-3.35-4.77.818-.574 2.978 4.24 8.051-9.506.764.646z"/></svg>';

        setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = button.dataset.originalContent;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard. Please copy manually: ' + text);
    });
}

// Enhanced click handler with better debugging
document.addEventListener('click', function(e) {
    const target = e.target;
    
    // Handle copy button clicks
    const copyBtn = target.classList.contains('copy-btn') ? target : target.closest('.copy-btn');
    if (copyBtn) {
        e.preventDefault();
        e.stopPropagation();
        copyToClipboard(copyBtn);
        return;
    }

    // Handle add filter button clicks
    const addBtn = document.getElementById('add-filter-btn');
    if (addBtn && (target === addBtn || addBtn.contains(target))) {
        console.log('Add filter button detected in click handler');
        // Don't close menu if clicking the add button
        return;
    }

    // Close menu when clicking outside
    const menu = document.getElementById('filter-menu');
    if (menu && menu.dataset.open === 'true' && !menu.contains(target)) {
        closeFilterMenu();
    }
}, true);

// Export functions for global access
window.initJumpstartUI = initJumpstartUI;
window.toggleView = toggleView;
window.toggleFilterMenu = toggleFilterMenu;
window.addFilter = addFilter;
window.removeFilter = removeFilter;
window.updateFilter = updateFilter;
window.copyToClipboard = copyToClipboard;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initJumpstartUI);
} else {
    initJumpstartUI();
}

// Also try to initialize after a short delay in case there are timing issues
setTimeout(initJumpstartUI, 100);