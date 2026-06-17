const urlParams = new URLSearchParams(window.location.search);
const keyword = urlParams.get('q');
if (!keyword) {
    document.getElementById('searchResults').innerHTML = '<p>请输入搜索关键词。</p>';
} else {
    const lowerKeyword = keyword.toLowerCase();
    // 高亮函数
    function highlightText(text, kw) {
        if (!text) return '';
        const regex = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    // 搜索人物
    const matchedPersons = persons.filter(p => p.name.toLowerCase().includes(lowerKeyword) || (p.biography && p.biography.toLowerCase().includes(lowerKeyword)));
    // 搜索事件
    const matchedEvents = eventsData.filter(e => e.name.toLowerCase().includes(lowerKeyword) || (e.desc && e.desc.toLowerCase().includes(lowerKeyword)));
    // 搜索地点
    const matchedLocations = locations.filter(l => l.name.toLowerCase().includes(lowerKeyword) || (l.desc && l.desc.toLowerCase().includes(lowerKeyword)));
    // 搜索著作
    const matchedWorks = works.filter(w => w.title.toLowerCase().includes(lowerKeyword));

    let html = `<h2>🔍 搜索结果：“${keyword}”</h2>`;
    if (matchedPersons.length) {
        html += `<h3>👤 人物 (${matchedPersons.length})</h3>`;
        matchedPersons.forEach(p => {
            const nameHighlight = highlightText(p.name, keyword);
            html += `<div class="result-card"><h3><a href="person.html?name=${encodeURIComponent(p.name)}">${nameHighlight}</a></h3><div class="type">${p.occupation || '人物'}</div><p>${highlightText((p.biography || '').substring(0,120), keyword)}...</p></div>`;
        });
    }
    if (matchedEvents.length) {
        html += `<h3>📅 事件 (${matchedEvents.length})</h3>`;
        matchedEvents.forEach(e => {
            html += `<div class="result-card"><h3><a href="timeline.html?location=${encodeURIComponent(e.location)}&highlight=${encodeURIComponent(e.name)}">${highlightText(e.name, keyword)}</a></h3><div class="type">${e.location || '未知地点'} · ${e.start?.slice(0,4) || ''}</div><p>${highlightText((e.desc || '').substring(0,120), keyword)}...</p></div>`;
        });
    }
    if (matchedLocations.length) {
        html += `<h3>📍 地点 (${matchedLocations.length})</h3>`;
        matchedLocations.forEach(l => {
            html += `<div class="result-card"><h3>${highlightText(l.name, keyword)}</h3><div class="type">${l.type || '地点'}</div><p>${highlightText(l.desc || '', keyword)}</p><a href="map.html?highlight=${encodeURIComponent(l.name)}" class="location-link"><i class="fas fa-map-marked-alt"></i> 查看地图</a></div>`;
        });
    }
    if (matchedWorks.length) {
        html += `<h3>📖 著作 (${matchedWorks.length})</h3>`;
        matchedWorks.forEach(w => {
            html += `<div class="result-card"><h3>${highlightText(w.title, keyword)}</h3><div class="type">${w.type || '著作'}</div><p>${highlightText((w.description || '').substring(0,120), keyword)}...</p></div>`;
        });
    }
    if (matchedPersons.length + matchedEvents.length + matchedLocations.length + matchedWorks.length === 0) {
        html += `<p>没有找到相关内容，请尝试其他关键词。</p>`;
    }
    document.getElementById('searchResults').innerHTML = html;
}