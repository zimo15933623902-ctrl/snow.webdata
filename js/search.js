const urlParams = new URLSearchParams(window.location.search);
const keyword = urlParams.get('q');
if (!keyword) {
    document.getElementById('searchResults').innerHTML = '<p>请输入搜索关键词。</p>';
} else {
    const lowerKeyword = keyword.toLowerCase();
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
            html += `<div class="result-card"><h3><a href="person.html?name=${encodeURIComponent(p.name)}">${p.name}</a></h3><div class="type">${p.occupation || '人物'}</div><p>${(p.biography || '').substring(0,120)}...</p></div>`;
        });
    }
    if (matchedEvents.length) {
        html += `<h3>📅 事件 (${matchedEvents.length})</h3>`;
        matchedEvents.forEach(e => {
            html += `<div class="result-card"><h3><a href="timeline.html?location=${encodeURIComponent(e.location)}">${e.name}</a></h3><div class="type">${e.location || '未知地点'} · ${e.start?.slice(0,4) || ''}</div><p>${(e.desc || '').substring(0,120)}...</p></div>`;
        });
    }
    if (matchedLocations.length) {
        html += `<h3>📍 地点 (${matchedLocations.length})</h3>`;
        matchedLocations.forEach(l => {
            html += `<div class="result-card"><h3><a href="map.html?highlight=${encodeURIComponent(l.name)}">${l.name}</a></h3><div class="type">${l.type || '地点'}</div><p>${l.desc || ''}</p></div>`;
        });
    }
    if (matchedWorks.length) {
        html += `<h3>📖 著作 (${matchedWorks.length})</h3>`;
        matchedWorks.forEach(w => {
            html += `<div class="result-card"><h3>${w.title}</h3><div class="type">${w.type || '著作'}</div><p>${(w.description || '').substring(0,120)}...</p></div>`;
        });
    }
    if (matchedPersons.length + matchedEvents.length + matchedLocations.length + matchedWorks.length === 0) {
        html += `<p>没有找到相关内容，请尝试其他关键词。</p>`;
    }
    document.getElementById('searchResults').innerHTML = html;
}