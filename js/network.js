function initNetwork() {
    const graph = document.getElementById('logicGraph');
    const svg = document.getElementById('graphLines');
    const list = document.getElementById('nodeList');
    const detail = document.getElementById('nodeDetail');
    const search = document.getElementById('graphSearch');
    const panelTitle = document.getElementById('panelTitle');
    const panelSubtitle = document.getElementById('panelSubtitle');
    const backButton = document.getElementById('graphBack');
    const homeButton = document.getElementById('graphHome');
    if (!graph || !svg || !list) return;

    const snowName = '埃德加·斯诺';
    const snowImage = 'images/edgar-snow-bg.jpg';
    const directRelations = relations.filter(relation => relation.source === snowName || relation.target === snowName);
    const directPersonNames = new Set(directRelations.map(relation => relation.source === snowName ? relation.target : relation.source));

    const categoryDefinitions = [
        {
            id: 'history',
            title: '历史影响',
            subtitle: '斯诺记录并解释的时代事件',
            icon: '史',
            type: 'category',
            items: () => eventsData
                .slice()
                .sort((a, b) => importanceWeight(b.importance) - importanceWeight(a.importance))
                .slice(0, 9)
                .map(event => eventNode(event))
        },
        {
            id: 'locations',
            title: '地点',
            subtitle: '1928—1941 年在中国的关键足迹',
            icon: '地',
            type: 'category',
            items: () => locations.slice(0, 10).map(location => locationNode(location))
        },
        {
            id: 'persons',
            title: '人物',
            subtitle: '与斯诺发生采访、合作或政治关联的人',
            icon: '人',
            type: 'category',
            items: () => persons
                .filter(person => person.name !== snowName)
                .sort((a, b) => Number(directPersonNames.has(b.name)) - Number(directPersonNames.has(a.name)))
                .slice(0, 10)
                .map(person => personNode(person))
        },
        {
            id: 'works',
            title: '著作',
            subtitle: '报道、译介与回忆构成的文本线索',
            icon: '书',
            type: 'category',
            items: () => [
                workNode('我在旧中国十三年', '自传/回忆录', '记录斯诺 1928—1941 年间在中国的经历，是本数据库的重要文本基础。'),
                workNode('复始之旅', '回忆与观察', '从回望视角整理斯诺与中国革命、抗战和国际传播之间的关系。'),
                workNode('红星照耀中国', '采访报道', '斯诺红区之行后的代表作，使世界第一次系统了解中国共产党与红军。'),
                workNode('远东前线', '国际报道', '围绕日本侵华、东北与远东局势展开的新闻观察。'),
                workNode('活的中国', '文学译介', '斯诺编译中国左翼文学作品，向英语世界介绍鲁迅等中国作家。')
            ]
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
            items: () => directRelations.slice(0, 8).map(relation => {
                const targetName = relation.source === snowName ? relation.target : relation.source;
                const person = persons.find(item => item.name === targetName);
                return personNode(person, relation.relation);
            }).filter(Boolean)
        },
        {
            id: 'institutions',
            title: '机构',
            subtitle: '报刊、大学、组织与革命力量',
            icon: '机',
            type: 'category',
            items: () => [
                institutionNode('密勒氏评论报', '新闻机构', '斯诺早期记者生涯的重要平台，鲍威尔是其编辑领路人。'),
                institutionNode('燕京大学', '教育机构', '斯诺在北平任教，并由此接近学生运动与知识界。'),
                institutionNode('中国工业合作社', '社会组织', '斯诺与路易·艾黎共同推动的抗战经济合作网络。'),
                institutionNode('陕北红区', '革命根据地', '斯诺进入红区采访中共领袖与红军的重要空间。'),
                institutionNode('国民政府', '政治机构', '斯诺采访、观察并批评其腐败与消极抗战。')
            ]
        },
        {
            id: 'background',
            title: '背景',
            subtitle: '理解斯诺叙事的历史底色',
            icon: '背',
            type: 'category',
            items: () => eventsData
                .filter(event => ['五四运动', '辛亥革命', '太平天国运动', '日俄战争', '中法战争'].includes(event.name))
                .map(event => eventNode(event))
        }
    ];

    const centerNode = {
        id: 'snow',
        title: snowName,
        subtitle: '中心人物',
        type: 'center',
        icon: '斯',
        image: snowImage,
        desc: '美国记者，首位深入红区采访毛泽东。点击周围知识节点，可按主题逐层展开人物、地点、事件与文本线索。',
        text: persons.find(person => person.name === snowName)?.original_text || ''
    };

    let currentParent = centerNode;
    let currentNodes = categoryDefinitions.map(category => ({ ...category }));
    let activeNodeId = null;
    let trail = [centerNode];
    let historyStack = [];

    function importanceWeight(importance) {
        return { '极高': 5, '高': 4, '中': 3, '低': 2 }[importance] || 1;
    }

    function safeId(prefix, value) {
        return `${prefix}-${String(value).replace(/[^\u4e00-\u9fa5a-zA-Z0-9]+/g, '-')}`;
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
            children: () => eventsData
                .filter(event => event.location === location.name)
                .slice(0, 6)
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

    function workNode(title, subtitle, desc) {
        return {
            id: safeId('work', title),
            title,
            subtitle,
            type: 'work',
            icon: '书',
            desc,
            children: () => eventsData
                .filter(event => event.event_text && event.event_text.includes(title.replace('我在', '')))
                .slice(0, 4)
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
                const location = locations.find(item => item.name === locationName);
                const events = eventsData.filter(event => event.location === locationName).slice(0, 4).map(event => eventNode(event));
                return location ? [locationNode(location), ...events] : events;
            }
        };
    }

    function institutionNode(title, subtitle, desc) {
        return {
            id: safeId('institution', title),
            title,
            subtitle,
            type: 'institution',
            icon: '机',
            desc,
            children: () => persons
                .filter(person => person.original_text?.includes(title) || person.bio?.includes(title))
                .slice(0, 5)
                .map(person => personNode(person))
        };
    }

    function relatedToEvent(event) {
        const output = [];
        const location = locations.find(item => item.name === event.location);
        if (location) output.push(locationNode(location));
        persons.forEach(person => {
            const haystack = `${event.desc || ''}${event.event_text || ''}`;
            if (haystack.includes(person.name) && person.name !== snowName) output.push(personNode(person));
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
        return output.slice(0, 7);
    }

    function relatedToPerson(person) {
        const output = relations
            .filter(relation => relation.source === person.name || relation.target === person.name)
            .map(relation => {
                const targetName = relation.source === person.name ? relation.target : relation.source;
                const relatedPerson = persons.find(item => item.name === targetName);
                return personNode(relatedPerson, relation.relation);
            })
            .filter(Boolean);
        eventsData.forEach(event => {
            const haystack = `${event.desc || ''}${event.event_text || ''}`;
            if (haystack.includes(person.name)) output.push(eventNode(event));
        });
        return output.slice(0, 7);
    }

    function nodeChildren(node) {
        if (typeof node.items === 'function') return node.items();
        if (typeof node.children === 'function') return node.children();
        return [];
    }

    function positionsFor(count) {
        const presets = {
            1: [[66, 48]],
            2: [[63, 38], [63, 62]],
            3: [[60, 31], [73, 50], [60, 69]],
            4: [[57, 28], [72, 41], [72, 62], [57, 74]],
            5: [[52, 25], [70, 36], [76, 53], [65, 72], [47, 69]],
            6: [[48, 24], [66, 30], [76, 48], [67, 67], [49, 74], [38, 52]],
            7: [[44, 24], [61, 26], [74, 39], [76, 58], [63, 72], [45, 75], [35, 51]],
            8: [[41, 24], [57, 23], [71, 34], [77, 50], [71, 66], [57, 76], [41, 75], [32, 52]],
            9: [[40, 24], [55, 22], [68, 31], [77, 45], [76, 61], [64, 73], [49, 77], [35, 68], [30, 50]],
            10: [[39, 24], [52, 22], [65, 28], [75, 39], [78, 53], [72, 66], [60, 75], [45, 77], [32, 67], [28, 51]]
        };
        return presets[Math.min(Math.max(count, 1), 10)] || presets[8];
    }

    function centerPosition(depth) {
        return { x: 50, y: 52 };
    }

    function circularPositionsFor(count, center) {
        if (count <= 1) return [{ x: center.x + 24, y: center.y }];
        const radiusX = count >= 9 ? 32 : 29;
        const radiusY = count >= 9 ? 31 : 28;
        const startAngle = -90;
        return Array.from({ length: count }, (_, index) => {
            const angle = (startAngle + index * 360 / count) * Math.PI / 180;
            return {
                x: Math.max(15, Math.min(85, center.x + Math.cos(angle) * radiusX)),
                y: Math.max(16, Math.min(84, center.y + Math.sin(angle) * radiusY))
            };
        });
    }

    function render(parent = centerNode, nodes = currentNodes) {
        currentParent = parent;
        currentNodes = nodes.filter(Boolean).slice(0, 10);
        graph.innerHTML = '';
        svg.innerHTML = '';
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('preserveAspectRatio', 'none');
        const center = centerPosition(trail.length);
        renderNode(parent, center.x, center.y, parent.type === 'center' ? 'center' : 'branch active');
        const positions = circularPositionsFor(currentNodes.length, center);
        positions.slice(0, currentNodes.length).forEach((position, index) => {
            const node = currentNodes[index];
            renderLine(center.x, center.y, position.x, position.y, node.edgeLabel || '');
            renderNode(node, position.x, position.y, node.type === 'category' ? 'branch' : 'leaf');
        });
        renderList(currentNodes);
        renderDetail(parent);
        panelTitle.textContent = parent.type === 'center' ? '知识体系' : parent.title;
        panelSubtitle.textContent = parent.type === 'center' ? '点击知识节点展开下一层' : parent.subtitle || '点击节点继续展开';
        if (backButton) backButton.disabled = historyStack.length === 0;
    }

    function renderLine(x1, y1, x2, y2, label = '') {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', `${x1}`);
        line.setAttribute('y1', `${y1}`);
        line.setAttribute('x2', `${x2}`);
        line.setAttribute('y2', `${y2}`);
        line.setAttribute('vector-effect', 'non-scaling-stroke');
        line.setAttribute('stroke', 'rgba(179,45,45,0.24)');
        line.setAttribute('stroke-width', '2.5');
        line.setAttribute('stroke-dasharray', '8 9');
        line.setAttribute('stroke-linecap', 'round');
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        arrow.setAttribute('cx', `${x2}`);
        arrow.setAttribute('cy', `${y2}`);
        arrow.setAttribute('r', '3.5');
        arrow.setAttribute('fill', 'rgba(179,45,45,0.34)');
        group.append(line, arrow);
        if (label && label !== '地点' && label !== '人物' && label !== '事件类型') {
            const midX = x1 + (x2 - x1) * 0.56;
            const midY = y1 + (y2 - y1) * 0.56;
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', `${midX}`);
            text.setAttribute('y', `${midY}`);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', '#8f2525');
            text.setAttribute('font-size', '0.72');
            text.setAttribute('font-weight', '700');
            text.setAttribute('paint-order', 'stroke');
            text.setAttribute('stroke', 'rgba(255,255,255,0.96)');
            text.setAttribute('stroke-width', '0.45');
            text.textContent = compactLabel(label);
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = label;
            text.appendChild(title);
            group.appendChild(text);
        }
        svg.appendChild(group);
    }

    function compactLabel(label) {
        const cleanLabel = String(label)
            .replace(/\s+/g, '')
            .replace(/\/+/g, '·')
            .replace(/（.*?）|\(.*?\)/g, '');
        return cleanLabel;
    }

    function renderNode(node, x, y, className) {
        const button = document.createElement('button');
        button.className = `graph-node ${className} ${activeNodeId === node.id ? 'active' : ''}`;
        button.style.left = `${x}%`;
        button.style.top = `${y}%`;
        button.type = 'button';
        button.title = node.subtitle ? `${node.title}：${node.subtitle}` : node.title;
        button.innerHTML = `
            <span class="node-avatar">${node.image ? `<img src="${node.image}" alt="${node.title}">` : `<span>${node.icon || node.title.slice(0, 1)}</span>`}</span>
            <span class="node-label">${node.title}</span>
        `;
        button.addEventListener('click', () => selectNode(node));
        graph.appendChild(button);
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
            trail = node.type === 'category' ? [centerNode, node] : [...trail.filter(item => item.id !== node.id), node].slice(-3);
            render(node, children);
        } else {
            renderList(currentNodes);
            renderDetail(node);
            document.querySelectorAll('.graph-node').forEach(item => item.classList.remove('active'));
            const matchingNode = Array.from(document.querySelectorAll('.graph-node')).find(item => item.title.startsWith(node.title));
            if (matchingNode) matchingNode.classList.add('active');
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
            ...persons.filter(person => `${person.name}${person.bio}${person.original_text || ''}`.includes(value)).map(person => personNode(person)),
            ...eventsData.filter(event => `${event.name}${event.desc}${event.event_text || ''}${event.location || ''}`.includes(value)).map(event => eventNode(event)),
            ...locations.filter(location => `${location.name}${location.type}${location.desc}`.includes(value)).map(location => locationNode(location))
        ];
        const unique = [];
        const seen = new Set();
        results.forEach(node => {
            if (node && !seen.has(node.id)) {
                seen.add(node.id);
                unique.push(node);
            }
        });
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
        render(searchRoot, unique.slice(0, 10));
    }

    let searchTimer;
    search?.addEventListener('input', event => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => runSearch(event.target.value), 160);
    });
    backButton?.addEventListener('click', goBack);
    homeButton?.addEventListener('click', goHome);

    render(centerNode, categoryDefinitions);
    window.addEventListener('resize', () => render(currentParent, currentNodes));
}

document.addEventListener('DOMContentLoaded', initNetwork);
