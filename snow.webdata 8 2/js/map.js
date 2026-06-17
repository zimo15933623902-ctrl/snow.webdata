let mapInstance = null;
let markers = [];

// 标准化字符串，用于地点匹配
function normalize(str) {
    if (!str) return '';
    return String(str).trim().toLowerCase().replace(/[，,、()（）]/g, '');
}

// 手动映射：子地点应继承哪些母地点的事件
// 基于 Excel 中的 Location 和 Event 数据生成
const parentLocationMap = {
    // 上海市的子地点（继承上海的事件）
    "虹口": ["上海"],
    "闸北": ["上海"],
    "江湾": ["上海"],
    "庙行": ["上海"],
    "吴淞": ["上海"],
    "龙华": ["上海"],
    "公共租界": ["上海"],
    "法国租界": ["上海"],
    "上海北站": ["上海"],
    "南市": ["上海"],
    "租界": ["上海"],
    // 北京市的子地点（继承北京的事件）
    "东交民巷": ["北京"],
    "海淀": ["北京"],
    "西山": ["北京"],
    "海淀区": ["北京"],
    "南苑": ["北京"],
    "天安门广场": ["北京"],
    "紫禁城": ["北京"],
    // 南京市相关（事件本身有“南京”，无需额外映射；但以下地点可继承南京事件）
    "金陵": ["南京"],
    // 沈阳相关
    "奉天": ["沈阳"],
    // 云南相关
    "云南高地": ["昆明"],
    "个旧": ["昆明"],
    "大理": ["昆明"],
    "舍资": ["昆明"],
    "禄丰": ["昆明"],
    // 陕甘宁边区
    "西北红区": ["保安", "延安"],
    "陕甘宁特区": ["保安", "延安"],
    "陕甘宁边区": ["保安", "延安"],
    "红区": ["保安", "延安"],
    "苏区": ["保安", "延安"],
    "陕北": ["保安", "延安"],
    "陕北革命根据地": ["保安", "延安"],
    // 其他
    "绥远": ["萨拉齐"],
    "归化": ["萨拉齐"],
    "张家口": ["北京"],
    "天津": ["北京"],
    "华北": ["北京"],
    "长江流域": ["上海", "南京", "汉口"]
};

function initMap() {
    console.log('=== 地图初始化开始 ===');
    
    if (typeof L === 'undefined') {
        console.error('Leaflet 未加载');
        const container = document.getElementById('dynamicEventsList');
        if (container) container.innerHTML = '<div class="error-msg">❌ 地图库加载失败，请检查网络后刷新页面。</div>';
        return;
    }
    
    if (typeof locations === 'undefined' || typeof eventsData === 'undefined') {
        console.error('数据未加载', { locations: typeof locations, eventsData: typeof eventsData });
        const container = document.getElementById('dynamicEventsList');
        if (container) container.innerHTML = '<div class="error-msg">❌ 数据文件加载失败，请确保 js/data.js 存在且路径正确。</div>';
        return;
    }
    
    console.log(`✓ 数据加载成功：${locations.length} 个地点，${eventsData.length} 个事件`);
    
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('找不到地图容器 #map');
        return;
    }
    
    try {
        if (mapInstance) mapInstance.remove();
        mapInstance = L.map('map').setView([35.0, 110.0], 5);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
            subdomains: 'abcd',
            maxZoom: 19,
            minZoom: 4
        }).addTo(mapInstance);
        console.log('✓ 地图底图已加载');
        
        const getColor = (type) => {
            const t = (type || "").toString();
            if (t.includes("重大") || t.includes("事件")) return "#b32d2d";
            if (t.includes("长期") || t.includes("居住")) return "#5a7d9a";
            return "#6b8c6b";
        };
        
        // 遍历地点，创建标记
        locations.forEach(loc => {
            const color = getColor(loc.type);
            const marker = L.circleMarker([loc.lat, loc.lng], {
                radius: 8,
                fillColor: color,
                color: "#fff",
                weight: 1.5,
                opacity: 1,
                fillOpacity: 0.85
            }).addTo(mapInstance);
            
            const locName = loc.name;
            const normLocName = normalize(locName);
            
            // 获取该地点应匹配的所有名称（包括自身和映射的父地点）
            let matchNames = [normLocName];
            if (parentLocationMap[locName]) {
                parentLocationMap[locName].forEach(parent => {
                    matchNames.push(normalize(parent));
                });
            }
            
            // 过滤事件：事件 location 标准化后出现在 matchNames 中
            const relatedEvents = eventsData.filter(ev => {
                const normEvLoc = normalize(ev.location);
                return matchNames.some(matchName => 
                    normEvLoc === matchName || normEvLoc.includes(matchName) || matchName.includes(normEvLoc)
                );
            });
            
            // 构建弹窗内容
            let popupContent = `<b>${loc.name}</b> (${loc.type})<br/>${loc.desc}<br/><br/><b>📅 相关事件:</b><ul>`;
            if (relatedEvents.length === 0) {
                popupContent += `<li>无直接关联事件</li>`;
                // console.warn(`地点 "${loc.name}" 未匹配到任何事件`);
            } else {
                relatedEvents.forEach(ev => {
                    const year = ev.start ? ev.start.slice(0,4) : '';
                    popupContent += `<li><strong>${ev.name}</strong> (${year})<br/>${ev.desc.substring(0,60)}...</li>`;
                });
            }
            popupContent += `</ul><button class="loc-jump" data-loc="${loc.name}" style="margin-top:8px; padding:4px 10px; background:#b32d2d; border:none; border-radius:20px; cursor:pointer; color:white;">🔍 查看时间轴</button>`;
            marker.bindPopup(popupContent);
            
            // 悬浮提示
            let tooltipText = `${loc.name} (${loc.type})\n`;
            if (relatedEvents.length > 0) {
                tooltipText += relatedEvents.map(ev => ev.name).join(' · ');
            } else {
                tooltipText += '重要途经地';
            }
            marker.bindTooltip(tooltipText, { sticky: true, direction: 'top' });
            
            // 弹窗内按钮跳转
            marker.on('popupopen', () => {
                document.querySelectorAll('.loc-jump').forEach(btn => {
                    btn.onclick = () => {
                        window.location.href = `timeline.html?location=${encodeURIComponent(btn.getAttribute('data-loc'))}`;
                    };
                });
            });
            markers.push(marker);
        });
        
        // 侧边栏事件列表（所有事件按地点分组，并保持点击跳转）
        const container = document.getElementById('dynamicEventsList');
        if (container) {
            container.innerHTML = eventsData.map(ev => {
                const year = ev.start ? ev.start.slice(0,4) : '';
                return `<div class="loc-event-item" data-location="${ev.location}">
                    <div class="loc-event-name">📌 ${ev.name} · ${year}</div>
                    <div class="loc-event-desc">${ev.desc.substring(0,80)}...</div>
                    <div style="font-size:0.7rem; color:#777;">📍 ${ev.location}</div>
                </div>`;
            }).join('');
            document.querySelectorAll('.loc-event-item').forEach(el => {
                el.addEventListener('click', () => {
                    const loc = el.getAttribute('data-location');
                    window.location.href = `timeline.html?location=${encodeURIComponent(loc)}`;
                });
            });
            console.log('✓ 侧边栏事件列表已渲染');
        }
        
        // 处理 URL 参数高亮（从时间轴跳转过来）
        const urlParams = new URLSearchParams(window.location.search);
        const highlightLoc = urlParams.get('highlight');
        if (highlightLoc) {
            setTimeout(() => {
                const target = locations.find(l => l.name === highlightLoc);
                if (target) {
                    mapInstance.setView([target.lat, target.lng], 7);
                    const marker = markers.find((m, idx) => locations[idx].name === highlightLoc);
                    if (marker) marker.openPopup();
                }
            }, 500);
        }
        
        // 强制刷新地图尺寸
        setTimeout(() => {
            if (mapInstance) {
                mapInstance.invalidateSize();
                mapInstance.setView([35.0, 110.0], 5);
            }
        }, 200);

        // 暴露全局变量供外部定位使用
        window.mapInstance = mapInstance;
        window.markers = markers;
        
        console.log('=== 地图初始化完成 ===');
    } catch (error) {
        console.error('地图初始化出错:', error);
        const container = document.getElementById('dynamicEventsList');
        if (container) {
            container.innerHTML = `<div class="error-msg">❌ 地图初始化失败: ${error.message}<br>请尝试刷新页面或查看控制台。</div>`;
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
} else {
    initMap();
}

window.addEventListener('resize', () => {
    if (mapInstance) setTimeout(() => mapInstance.invalidateSize(), 100);
});