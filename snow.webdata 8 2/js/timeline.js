let currentFilter = 'all';

const categoryAliases = {
    '军事冲突': '军事行动',
    '军事行动': '军事行动',
    '政治事件': '政治事件',
    '政治暴力': '政治事件',
    '政治革命': '政治事件'
};

function normalizeCategory(category) {
    return categoryAliases[category] || category;
}

function normalizedCategoriesFor(event) {
    const rawCategories = event.categories || (event.type ? [event.type] : []);
    return [...new Set(rawCategories.map(normalizeCategory))];
}

function renderTimeline() {
    const container = document.getElementById('timeline-container');
    if (!container) return;
    if (typeof eventsData === 'undefined') {
        container.innerHTML = '<div class="error-msg">❌ 数据文件加载失败。</div>';
        return;
    }
    let filtered = eventsData.filter(ev => {
        if (currentFilter === 'all') return true;
        return normalizedCategoriesFor(ev).includes(currentFilter);
    });
    filtered.sort((a,b)=> new Date(a.start) - new Date(b.start));
    container.innerHTML = filtered.map(ev => {
        const year = ev.start ? ev.start.slice(0,4) : '';
        let originalHtml = '';
        if (ev.event_text && ev.event_text.trim() !== '') {
            originalHtml = `<div class="event-original-text"><strong>📖 原文摘录：</strong><div class="original-content">${ev.event_text}</div></div>`;
        }
        return `
        <div class="timeline-item" data-location="${ev.location}">
            <div class="timeline-date">${year} <span class="importance">${ev.importance}</span></div>
            <div class="timeline-title">${ev.name}</div>
            <div class="timeline-desc">${ev.desc}</div>
            <div class="timeline-meta"><span><i class="fas fa-map-marker-alt"></i> ${ev.location}</span><span>${normalizedCategoriesFor(ev).join('、')}</span></div>
            ${originalHtml}
            <button class="timeline-btn" data-loc="${ev.location}"><i class="fas fa-map-marked-alt"></i> 查看地图</button>
        </div>`;
    }).join('');
    
    document.querySelectorAll('.timeline-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const loc = btn.getAttribute('data-loc');
            window.location.href = `map.html?highlight=${encodeURIComponent(loc)}`;
        });
    });

    const urlParams = new URLSearchParams(window.location.search);
    const targetLoc = urlParams.get('location');
    if (targetLoc) {
        setTimeout(() => {
            const items = document.querySelectorAll('.timeline-item');
            for (let item of items) {
                if (item.getAttribute('data-location') === targetLoc) {
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    item.style.boxShadow = '0 0 0 3px #b32d2d';
                    setTimeout(() => item.style.boxShadow = '', 2000);
                    break;
                }
            }
        }, 300);
    }
}

function bindFilters() {
    const filterContainer = document.querySelector('.timeline-controls');
    if (!filterContainer) return;
    const categoriesSet = new Set();
    eventsData.forEach(ev => {
        normalizedCategoriesFor(ev).forEach(cat => categoriesSet.add(cat));
    });
    const categories = Array.from(categoriesSet).sort();
    let html = '<span>筛选类型：</span>';
    html += `<button class="filter-btn active-filter" data-filter="all">全部</button>`;
    categories.forEach(cat => {
        html += `<button class="filter-btn" data-filter="${cat}">${cat}</button>`;
    });
    filterContainer.innerHTML = html;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active-filter'));
            btn.classList.add('active-filter');
            currentFilter = btn.getAttribute('data-filter');
            renderTimeline();
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const countEl = document.getElementById('timelineCount');
    if (countEl && typeof eventsData !== 'undefined') countEl.textContent = eventsData.length;
    bindFilters();
    renderTimeline();
});
