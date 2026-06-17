(function() {
    const gridContainer = document.getElementById('browseGrid');
    const tabs = document.querySelectorAll('.tab-btn');
    let currentCategory = 'persons';

    // 确保全局数据可用
    if (typeof persons === 'undefined' || typeof eventsData === 'undefined' || typeof locations === 'undefined' || typeof works === 'undefined') {
        gridContainer.innerHTML = '<p style="color:red;">数据加载失败，请刷新页面。</p>';
        return;
    }

    function renderCategory(category) {
        let items = [];
        let titleField = 'name';
        let descField = 'desc';
        let linkTarget = '';

        switch(category) {
            case 'persons':
                items = persons.filter(p => p.name !== '埃德加·斯诺'); // 可选过滤中心人物
                titleField = 'name';
                descField = 'biography';
                linkTarget = (item) => `person.html?name=${encodeURIComponent(item.name)}`;
                break;
            case 'events':
                items = eventsData;
                titleField = 'name';
                descField = 'desc';
                linkTarget = (item) => `timeline.html?location=${encodeURIComponent(item.location)}&highlight=${encodeURIComponent(item.name)}`;
                break;
            case 'locations':
                items = locations;
                titleField = 'name';
                descField = 'desc';
                linkTarget = (item) => `map.html?highlight=${encodeURIComponent(item.name)}`;
                break;
            case 'works':
                items = works;
                titleField = 'title';
                descField = 'description';
                linkTarget = (item) => `#`; // 著作暂不跳转详情页，可留空或后续扩展
                break;
            default: return;
        }

        if (!items.length) {
            gridContainer.innerHTML = '<p>暂无数据。</p>';
            return;
        }

        const html = items.map(item => {
            const title = item[titleField] || '未命名';
            const desc = item[descField] ? (item[descField].substring(0, 100) + (item[descField].length > 100 ? '…' : '')) : '暂无简介';
            let subInfo = '';
            if (category === 'persons') subInfo = `<div class="type">${item.occupation || '人物'}</div>`;
            if (category === 'events') subInfo = `<div class="type">${item.location || '未知地点'} · ${item.start ? item.start.slice(0,4) : ''}</div>`;
            if (category === 'locations') subInfo = `<div class="type">${item.type || '地点'}</div>`;
            if (category === 'works') subInfo = `<div class="type">${item.type || '著作'}</div>`;

            return `
                <div class="browse-card" data-link="${linkTarget(item)}">
                    <h3>${title}</h3>
                    ${subInfo}
                    <p>${desc}</p>
                </div>
            `;
        }).join('');

        gridContainer.innerHTML = html;

        // 绑定点击事件跳转
        document.querySelectorAll('.browse-card').forEach(card => {
            card.addEventListener('click', () => {
                const link = card.getAttribute('data-link');
                if (link && link !== '#') window.location.href = link;
            });
        });
    }

    function setActiveTab(category) {
        tabs.forEach(tab => {
            if (tab.getAttribute('data-category') === category) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            currentCategory = tab.getAttribute('data-category');
            setActiveTab(currentCategory);
            renderCategory(currentCategory);
        });
    });

    // 初始渲染
    renderCategory('persons');
})();