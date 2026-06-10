const personsList = persons; // 来自 data.js
const relationsList = relations; // 来自 data.js

// 节点去重，只包含 persons 中的人物
const nodes = personsList.map(p => ({
    id: p.name,
    name: p.name,
    category: p.name === '埃德加·斯诺' ? 0 : 1,
    symbolSize: p.name === '埃德加·斯诺' ? 60 : 35,
    itemStyle: { color: p.name === '埃德加·斯诺' ? '#b32d2d' : '#5a7d9a' }
}));

// 边：过滤出 source 和 target 都在 persons 中的关系
const links = relationsList
    .filter(r => personsList.some(p => p.name === r.source) && personsList.some(p => p.name === r.target))
    .map(r => ({ source: r.source, target: r.target, label: r.relation }));

const chart = echarts.init(document.getElementById('globalGraph'));
chart.setOption({
    title: { show: false },
    series: [{
        type: 'graph',
        layout: 'force',
        force: { repulsion: 500, edgeLength: 120, gravity: 0.1, friction: 0.2 },
        roam: true,
        draggable: true,
        data: nodes,
        links: links,
        label: { show: true, position: 'right', fontSize: 12, offset: [5, 0] },
        emphasis: { focus: 'adjacency' },
        lineStyle: { color: 'rgba(179,45,45,0.3)', width: 1.5, curveness: 0.2, type: 'solid' },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 6],
        edgeLabel: { show: true, formatter: (params) => params.data.label, fontSize: 10, offset: [0, -8] }
    }]
});
chart.on('click', (params) => {
    if (params.dataType === 'node') {
        window.location.href = `person.html?name=${encodeURIComponent(params.data.name)}`;
    }
});