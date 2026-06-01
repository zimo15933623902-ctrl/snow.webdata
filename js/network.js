function initNetwork() {
    const graph = document.getElementById('logicGraph');
    const list = document.getElementById('nodeList');
    const detail = document.getElementById('nodeDetail');
    const search = document.getElementById('graphSearch');
    const panelTitle = document.getElementById('panelTitle');
    const panelSubtitle = document.getElementById('panelSubtitle');
    const backButton = document.getElementById('graphBack');
    const homeButton = document.getElementById('graphHome');
    if (!graph || !list) return;

    if (typeof echarts === 'undefined') {
        graph.innerHTML = '<div style="padding:2rem;color:#8f2525;font-weight:700;">图谱组件加载失败，请刷新页面或检查网络。</div>';
        return;
    }

    const chart = echarts.init(graph);
    const snowName = '埃德加·斯诺';
    const snowImage = 'images/edgar-snow-bg.jpg';
    const allLocations = typeof locations !== 'undefined' ? locations : [];
    const allEvents = typeof eventsData !== 'undefined' ? eventsData : [];
    const allWorks = typeof works !== 'undefined' ? works : [];
    const allOrganizations = typeof organizations !== 'undefined' ? organizations : [];
    const allPersons = typeof persons !== 'undefined' ? persons : [];
    const allRelations = typeof relations !== 'undefined' ? relations : [];
    const directRelations = allRelations.filter(relation => relation.source === snowName || relation.target === snowName);
    const directPersonNames = new Set(directRelations.map(relation => relation.source === snowName ? relation.target : relation.source));

    const centerNode = {
        id: 'snow',
        title: snowName,
        subtitle: '中心人物',
        type: 'center',
        icon: '斯',
        image: snowImage,
        desc: '美国记者，首位深入红区采访毛泽东。点击周围知识节点，可按主题逐层展开人物、地点、事件与文本线索。',
        text: allPersons.find(person => person.name === snowName)?.original_text || ''
    };

    const categoryDefinitions = [
        {
            id: 'works',
            title: '著作',
            subtitle: `报道、译介与回忆构成的文本线索（共 ${allWorks.length} 部）`,
            icon: '书',
            type: 'category',
            items: () => allWorks.map(work => workNode(work))
        },
        {
            id: 'institutions',
            title: '机构',
            subtitle: `报刊、大学、组织与革命力量（共 ${allOrganizations.length} 个）`,
            icon: '机',
            type: 'category',
            items: () => allOrganizations.map(org => institutionNode(org))
        },
        {
            id: 'persons',
            title: '人物',
            subtitle: `与斯诺发生采访、合作或政治关联的人（共 ${allPersons.filter(person => person.name !== snowName).length} 位）`,
            icon: '人',
            type: 'category',
            items: () => allPersons
                .filter(person => person.name !== snowName)
                .sort((a, b) => Number(directPersonNames.has(b.name)) - Number(directPersonNames.has(a.name)))
                .map(person => personNode(person))
        },
        {
            id: 'locations',
            title: '地点',
            subtitle: `1928—1941 年在中国的关键足迹（共 ${allLocations.length} 个）`,
            icon: '地',
            type: 'category',
            items: () => allLocations.map(location => locationNode(location))
        },
        {
            id: 'history',
            title: '历史影响',
            subtitle: `斯诺记录并解释的时代事件（共 ${allEvents.length} 个）`,
            icon: '史',
            type: 'category',
            items: () => allEvents
                .slice()
                .sort((a, b) => importanceWeight(b.importance) - importanceWeight(a.importance))
                .map(event => eventNode(event))
        },
        {
            id: 'journey',
            title: '经历',
            subtitle: '从旁观记者到革命见证者的成长路径',
            icon: '历',
            type: 'category',
            items: () => [
                journeyNode('初到上海', '1928', '抵达上海，在《密勒氏评论报》等机构工作，进入中国现场。', '上海'),
                journeyNode('西北觉醒', '1929', '萨拉齐大饥荒成为其人生观变化的重要节点。', '萨拉齐'),
                journeyNode('北平任教', '1930s', '在燕京大学任教并接触学生运动与知识界。', '北京'),
                journeyNode('红区采访', '1936', '突破封锁进入陕北，采访毛泽东、周恩来等中共领袖。', '保安'),
                journeyNode('抗战报道', '1937—1941', '持续报道抗战、工合运动与国共关系。', '重庆')
            ]
        },
        {
            id: 'interviews',
            title: '采访对象',
            subtitle: '最直接影响斯诺写作的对象',
            icon: '访',
            type: 'category',
            items: () => directRelations.map(relation => {
                const targetName = relation.source === snowName ? relation.target : relation.source;
                const person = allPersons.find(item => item.name === targetName);
                return personNode(person, relation.relation);
            }).filter(Boolean)
        },
        {
            id: 'background',
            title: '背景',
            subtitle: '理解斯诺叙事的历史底色',
            icon: '背',
            type: 'category',
            items: () => allEvents
                .filter(event => ['五四运动', '辛亥革命', '太平天国运动', '日俄战争', '中法战争'].includes(event.name))
                .map(event => eventNode(event))
        }
    ];

    let currentParent = centerNode;
    let currentNodes = categoryDefinitions.map(category => ({ ...category }));
    let activeNodeId = null;
    let trail = [centerNode];
    let historyStack = [];

    function importanceWeight(importance) {
        return { '极高': 5, '高': 4, '中': 3, '低': 2 }[importance] || 1;
    }

    function safeId(prefix, value) {
        return `${prefix}-${String(value || prefix).replace(/[^\u4e00-\u9fa5a-zA-Z0-9]+/g, '-')}`;
    }

    function includesAny(text, values) {
        const haystack = String(text || '');
        return values.filter(Boolean).some(value => haystack.includes(value));
    }

    function aliasesFor(item) {
        if (!item || !item.alias) return [];
        return Array.isArray(item.alias) ? item.alias : [item.alias];
    }

    function eventNode(event) {
        return {
            id: safeId('event', event.name),
            title: event.name,
            subtitle: `${event.start || '未知时间'} · ${event.location || '未知地点'}`,
            type: 'event',
            icon: '事',
            desc: event.desc,
            text: event.event_text,
            source: event,
            children: () => relatedToEvent(event)
        };
    }

    function locationNode(location) {
        return {
            id: safeId('location', location.name),
            title: location.name,
            subtitle: location.type || '地点',
            type: 'location',
            icon: '地',
            desc: location.desc,
            source: location,
            children: () => allEvents
                .filter(event => event.location === location.name)
                .map(event => eventNode(event))
        };
    }

    function personNode(person, relationLabel = '') {
        if (!person) return null;
        return {
            id: safeId('person', person.name),
            title: person.name,
            subtitle: relationLabel || person.bio || '人物',
            type: 'person',
            icon: person.name.slice(0, 1),
            desc: person.bio,
            text: person.original_text,
            edgeLabel: relationLabel,
            source: person,
            children: () => relatedToPerson(person)
        };
    }

    function workNode(work) {
        const title = work.title || work.name || '未命名著作';
        return {
            id: safeId('work', work.id || title),
            title,
            subtitle: work.type || '著作',
            type: 'work',
            icon: '书',
            desc: work.description || work.desc || '',
            source: work,
            children: () => allEvents
                .filter(event => includesAny(`${event.name}${event.desc || ''}${event.event_text || ''}`, [title, title.replace('我在', '')]))
                .map(event => eventNode(event))
        };
    }

    function journeyNode(title, subtitle, desc, locationName) {
        return {
            id: safeId('journey', title),
            title,
            subtitle,
            type: 'journey',
            icon: '历',
            desc,
            children: () => {
                const location = allLocations.find(item => item.name === locationName);
                const events = allEvents.filter(event => event.location === locationName).map(event => eventNode(event));
                return location ? [locationNode(location), ...events] : events;
            }
        };
    }

    function institutionNode(org) {
        const aliases = [org.name, ...aliasesFor(org)];
        return {
            id: safeId('institution', org.id || org.name),
            title: org.name,
            subtitle: [org.type, org.location].filter(Boolean).join(' · ') || '机构',
            type: 'institution',
            icon: '机',
            desc: org.description || org.desc || '',
            source: org,
            children: () => relatedToInstitution(org, aliases)
        };
    }

    function relatedToInstitution(org, aliases) {
        const output = [];
        allPersons.forEach(person => {
            const haystack = `${person.name}${person.bio || ''}${person.original_text || ''}`;
            if (includesAny(haystack, aliases) && person.name !== snowName) output.push(personNode(person));
        });
        allEvents.forEach(event => {
            const haystack = `${event.name}${event.desc || ''}${event.event_text || ''}${event.location || ''}`;
            if (includesAny(haystack, aliases)) output.push(eventNode(event));
        });
        if (org.location) {
            allLocations
                .filter(location => location.name === org.location)
                .forEach(location => output.unshift(locationNode(location)));
        }
        return uniqueNodes(output);
    }

    function relatedToEvent(event) {
        const output = [];
        const location = allLocations.find(item => item.name === event.location);
        if (location) output.push(locationNode(location));
        allPersons.forEach(person => {
            const haystack = `${event.desc || ''}${event.event_text || ''}`;
            if (haystack.includes(person.name) && person.name !== snowName) output.push(personNode(person));
        });
        allOrganizations.forEach(org => {
            const aliases = [org.name, ...aliasesFor(org)];
            const haystack = `${event.desc || ''}${event.event_text || ''}`;
            if (includesAny(haystack, aliases)) output.push(institutionNode(org));
        });
        if (!output.length && event.categories) {
            event.categories.forEach(category => output.push({
                id: safeId('category-tag', `${event.name}-${category}`),
                title: category,
                subtitle: '事件类型',
                type: 'tag',
                icon: '类',
                desc: `“${event.name}”所属的事件类型：${category}。`
            }));
        }
        return uniqueNodes(output);
    }

    function relatedToPerson(person) {
        const output = allRelations
            .filter(relation => relation.source === person.name || relation.target === person.name)
            .map(relation => {
                const targetName = relation.source === person.name ? relation.target : relation.source;
                const relatedPerson = allPersons.find(item => item.name === targetName);
                return personNode(relatedPerson, relation.relation);
            })
            .filter(Boolean);
        allEvents.forEach(event => {
            const haystack = `${event.desc || ''}${event.event_text || ''}`;
            if (haystack.includes(person.name)) output.push(eventNode(event));
        });
        allOrganizations.forEach(org => {
            const aliases = [org.name, ...aliasesFor(org)];
            const haystack = `${person.bio || ''}${person.original_text || ''}`;
            if (includesAny(haystack, aliases)) output.push(institutionNode(org));
        });
        return uniqueNodes(output);
    }

    function nodeChildren(node) {
        if (typeof node.items === 'function') return node.items();
        if (typeof node.children === 'function') return node.children();
        return [];
    }

    function uniqueNodes(nodes) {
        const unique = [];
        const seen = new Set();
        nodes.filter(Boolean).forEach(node => {
            if (!seen.has(node.id)) {
                seen.add(node.id);
                unique.push(node);
            }
        });
        return unique;
    }

    function render(parent = centerNode, nodes = currentNodes) {
        currentParent = parent;
        currentNodes = uniqueNodes(nodes);
        chart.clear();
        const total = currentNodes.length;
        const data = [parent, ...currentNodes].map((node, index) => chartNode(node, index === 0, total));
        const links = currentNodes.map(node => chartLink(parent, node, total));

        chart.setOption({
            backgroundColor: 'transparent',
            animationDurationUpdate: 450,
            tooltip: {
                trigger: 'item',
                confine: true,
                formatter(params) {
                    if (params.dataType === 'edge') {
                        return params.data.fullLabel || '关联';
                    }
                    const node = params.data.raw;
                    const count = childCount(node);
                    return `<strong>${node.title}</strong><br>${node.subtitle || node.desc || ''}<br>下一层：${count} 个节点`;
                }
            },
            series: [{
                type: 'graph',
                layout: 'force',
                roam: true,
                draggable: true,
                focusNodeAdjacency: true,
                scaleLimit: {
                    min: 0.35,
                    max: 4
                },
                labelLayout: {
                    hideOverlap: total > 55
                },
                edgeSymbol: ['none', 'arrow'],
                edgeSymbolSize: [0, 7],
                data,
                links,
                force: {
                    initLayout: 'circular',
                    repulsion: total > 80 ? 95 : total > 45 ? 140 : 250,
                    gravity: total > 80 ? 0.025 : 0.04,
                    edgeLength: total > 80 ? [58, 118] : total > 45 ? [74, 150] : [100, 210],
                    friction: 0.34,
                    layoutAnimation: true
                },
                lineStyle: {
                    color: 'rgba(179,45,45,0.26)',
                    width: 1.5,
                    type: 'dashed',
                    curveness: 0.05
                },
                label: {
                    show: true
                },
                emphasis: {
                    focus: 'adjacency',
                    lineStyle: {
                        color: '#b32d2d',
                        width: 2.5
                    }
                }
            }]
        }, true);

        chart.off('click');
        chart.on('click', params => {
            if (params.dataType === 'node' && params.data.raw) selectNode(params.data.raw);
        });
        renderList(currentNodes);
        renderDetail(parent);
        panelTitle.textContent = parent.type === 'center' ? '知识体系' : parent.title;
        panelSubtitle.textContent = parent.type === 'center' ? '点击知识节点展开下一层' : parent.subtitle || '点击节点继续展开';
        if (backButton) backButton.disabled = historyStack.length === 0;
    }

    function chartNode(node, isCenter, total) {
        const childTotal = childCount(node);
        const isActive = activeNodeId === node.id || isCenter;
        const size = isCenter ? 86 : node.type === 'category' ? 62 : symbolSize(total, childTotal);
        return {
            id: node.id,
            name: node.title,
            raw: node,
            value: childTotal,
            symbol: node.image ? `image://${node.image}` : 'circle',
            symbolSize: size,
            draggable: true,
            fixed: isCenter,
            x: isCenter ? graph.clientWidth / 2 : undefined,
            y: isCenter ? graph.clientHeight / 2 : undefined,
            itemStyle: {
                color: node.image ? '#fff' : nodeFill(node.type, isActive),
                borderColor: isActive ? '#b32d2d' : 'rgba(179,45,45,0.18)',
                borderWidth: isCenter ? 5 : 1.5,
                shadowBlur: isCenter ? 28 : 18,
                shadowColor: 'rgba(68,42,28,0.16)'
            },
            label: {
                show: true,
                position: isCenter ? 'bottom' : 'right',
                distance: isCenter ? 8 : 7,
                formatter: labelFormatter(node, isCenter, total),
                color: isCenter ? '#fff' : '#1e1e1e',
                fontSize: isCenter ? 13 : total > 70 ? 10 : total > 35 ? 11 : 12,
                fontWeight: isCenter ? 800 : 700,
                backgroundColor: isCenter ? '#b32d2d' : 'rgba(255,255,255,0.88)',
                borderColor: 'rgba(234,223,212,0.95)',
                borderWidth: isCenter ? 0 : 1,
                borderRadius: 14,
                padding: isCenter ? [6, 12] : [4, 8],
                shadowBlur: 12,
                shadowColor: 'rgba(68,42,28,0.08)'
            }
        };
    }

    function chartLink(parent, node, total) {
        const fullLabel = node.edgeLabel || '';
        const showLabel = Boolean(fullLabel) && total <= 55;
        return {
            source: parent.id,
            target: node.id,
            fullLabel,
            lineStyle: {
                color: 'rgba(179,45,45,0.25)',
                width: total > 60 ? 1.1 : 1.6,
                type: 'dashed',
                curveness: total > 50 ? 0.03 : 0.08
            },
            label: {
                show: showLabel,
                formatter: fullLabel,
                color: '#8f2525',
                fontSize: total > 35 ? 8 : 9,
                fontWeight: 600,
                backgroundColor: 'rgba(255,250,243,0.82)',
                borderColor: 'rgba(179,45,45,0.12)',
                borderWidth: 1,
                borderRadius: 8,
                padding: [2, 4]
            }
        };
    }

    function symbolSize(total, childTotal) {
        if (total > 100) return 24 + Math.min(childTotal, 8) * 1.5;
        if (total > 70) return 30 + Math.min(childTotal, 8) * 1.6;
        if (total > 45) return 38 + Math.min(childTotal, 8) * 1.8;
        return 50 + Math.min(childTotal, 8) * 2;
    }

    function nodeFill(type, isActive) {
        if (isActive) return '#fff6ef';
        const colors = {
            category: '#fffaf3',
            person: '#fff7f4',
            institution: '#fffaf3',
            location: '#fffaf3',
            event: '#fff7f4',
            work: '#fffaf3'
        };
        return colors[type] || '#fffaf3';
    }

    function labelFormatter(node, isCenter, total) {
        if (isCenter) return node.title;
        if (total > 80) return shortLabel(node.title, 8);
        if (total > 45) return shortLabel(node.title, 12);
        return node.title;
    }

    function shortLabel(text, limit) {
        const value = String(text || '');
        return value.length > limit ? `${value.slice(0, limit)}…` : value;
    }

    function renderList(nodes) {
        list.innerHTML = '';
        nodes.forEach((node, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `node-card ${activeNodeId === node.id ? 'active' : ''}`;
            button.innerHTML = `
                <span class="card-icon">${node.image ? `<img src="${node.image}" alt="${node.title}">` : `<span>${node.icon || node.title.slice(0, 1)}</span>`}</span>
                <span>
                    <span class="card-title">${node.title}</span>
                    <span class="card-meta">NODE ${index + 1}</span>
                </span>
                <span class="card-index" title="可展开的下一层节点数">${childCount(node)}</span>
            `;
            button.addEventListener('click', () => selectNode(node));
            list.appendChild(button);
        });
    }

    function childCount(node) {
        return nodeChildren(node).length;
    }

    function renderDetail(node) {
        const text = node.text ? `<p><strong>原文/资料：</strong>${node.text}</p>` : '';
        detail.innerHTML = `
            <h3>${node.title}</h3>
            <p>${node.desc || node.subtitle || '点击该节点可以继续查看下一层关联。'}</p>
            ${text}
        `;
    }

    function selectNode(node) {
        activeNodeId = node.id;
        const children = nodeChildren(node);
        if (children.length) {
            pushHistory();
            trail = node.type === 'category' ? [centerNode, node] : [...trail.filter(item => item.id !== node.id), node].slice(-4);
            render(node, children);
        } else {
            renderList(currentNodes);
            renderDetail(node);
            chart.dispatchAction({ type: 'downplay' });
            chart.dispatchAction({ type: 'highlight', name: node.title });
        }
    }

    function pushHistory() {
        historyStack.push({
            parent: currentParent,
            nodes: currentNodes,
            active: activeNodeId,
            trail: [...trail]
        });
    }

    function goBack() {
        const previous = historyStack.pop();
        if (!previous) return;
        currentParent = previous.parent;
        currentNodes = previous.nodes;
        activeNodeId = previous.active;
        trail = previous.trail;
        render(currentParent, currentNodes);
    }

    function goHome() {
        historyStack = [];
        trail = [centerNode];
        activeNodeId = null;
        if (search) search.value = '';
        render(centerNode, categoryDefinitions);
    }

    function runSearch(keyword) {
        const value = keyword.trim();
        if (!value) {
            goHome();
            return;
        }
        const results = [
            ...allPersons.filter(person => `${person.name}${person.bio}${person.original_text || ''}`.includes(value)).map(person => personNode(person)),
            ...allEvents.filter(event => `${event.name}${event.desc}${event.event_text || ''}${event.location || ''}`.includes(value)).map(event => eventNode(event)),
            ...allLocations.filter(location => `${location.name}${location.type}${location.desc}`.includes(value)).map(location => locationNode(location)),
            ...allOrganizations.filter(org => `${org.name}${org.type || ''}${org.description || ''}${org.location || ''}${aliasesFor(org).join('')}`.includes(value)).map(org => institutionNode(org)),
            ...allWorks.filter(work => `${work.title}${work.type || ''}${work.description || ''}`.includes(value)).map(work => workNode(work))
        ];
        const unique = uniqueNodes(results);
        const searchRoot = {
            id: 'search-root',
            title: '搜索结果',
            subtitle: `关键词：${value}`,
            type: 'search',
            icon: '搜',
            desc: unique.length ? `找到 ${unique.length} 条相关线索。` : '没有找到匹配结果，请换一个关键词试试。'
        };
        trail = [centerNode, searchRoot];
        historyStack = [];
        render(searchRoot, unique);
    }

    let searchTimer;
    search?.addEventListener('input', event => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => runSearch(event.target.value), 180);
    });
    backButton?.addEventListener('click', goBack);
    homeButton?.addEventListener('click', goHome);
    window.addEventListener('resize', () => chart.resize());

    render(centerNode, categoryDefinitions);
}

document.addEventListener('DOMContentLoaded', initNetwork);
