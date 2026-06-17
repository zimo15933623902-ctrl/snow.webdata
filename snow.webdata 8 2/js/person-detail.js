(function() {
    const params = new URLSearchParams(window.location.search);
    const personName = params.get('name');
    if (!personName) {
        document.getElementById('personDetail').innerHTML = '<p>未指定人物。</p>';
        return;
    }

    const person = persons.find(p => p.name === personName);
    if (!person) {
        document.getElementById('personDetail').innerHTML = `<p>未找到人物“${personName}”。</p>`;
        return;
    }

    // 关联关系
    const relatedRels = relations.filter(r => r.source === personName || r.target === personName);
    const relatedPersons = relatedRels.map(r => ({
        name: r.source === personName ? r.target : r.source,
        relation: r.relation
    }));

    // 相关事件
    const relatedEvents = eventsData.filter(ev => 
        (ev.desc && ev.desc.includes(personName)) || 
        (ev.event_text && ev.event_text.includes(personName)) ||
        ev.name.includes(personName)
    );

    // 构建HTML
    const html = `
        <button class="back-link" onclick="window.history.back()">← 返回</button>
        <div class="person-header">
            <div class="person-avatar">${personName.charAt(0)}</div>
            <div class="person-info">
                <h1>${personName}</h1>
                <div class="person-meta">
                    ${person.nationality ? `<span><i class="fas fa-flag"></i> ${person.nationality}</span>` : ''}
                    ${person.birth_date ? `<span><i class="fas fa-calendar-alt"></i> ${person.birth_date} — ${person.death_date || '?'}</span>` : ''}
                    ${person.occupation ? `<span><i class="fas fa-briefcase"></i> ${person.occupation}</span>` : ''}
                </div>
                <div class="person-bio">${person.biography || person.person_description || '暂无简介'}</div>
            </div>
        </div>

        <div class="section">
            <h3><i class="fas fa-users"></i> 关联人物 (${relatedPersons.length})</h3>
            <div class="relation-grid">
                ${relatedPersons.length ? relatedPersons.map(rp => `
                    <div class="relation-card">
                        <a href="person.html?name=${encodeURIComponent(rp.name)}">${rp.name}</a>
                        <div class="relation-type">${rp.relation || '关联'}</div>
                    </div>
                `).join('') : '<p>暂无直接关联人物</p>'}
            </div>
        </div>

        <div class="section">
            <h3><i class="fas fa-history"></i> 相关事件 (${relatedEvents.length})</h3>
            <div class="event-grid">
                ${relatedEvents.length ? relatedEvents.map(ev => `
                    <div class="event-card">
                        <a href="timeline.html?location=${encodeURIComponent(ev.location)}&highlight=${encodeURIComponent(ev.name)}">${ev.name}</a>
                        <div class="event-date">${ev.start ? ev.start.slice(0,4) : ''} · ${ev.location || '未知地点'}</div>
                        <div class="relation-type">${ev.desc ? ev.desc.substring(0,80) + '…' : ''}</div>
                    </div>
                `).join('') : '<p>暂无相关事件</p>'}
            </div>
        </div>

        <div class="section">
            <h3><i class="fas fa-quote-left"></i> 原文摘录</h3>
            <div class="original-text">
                ${person.original_text || (person.biography ? person.biography : '书中没有直接摘录。')}
            </div>
        </div>
    `;

    document.getElementById('personDetail').innerHTML = html;
})();