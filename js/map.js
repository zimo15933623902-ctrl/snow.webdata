
let mapInstance = null;
let markers = [];

function initMap() {
    if (typeof L === 'undefined') {
        console.error("Leaflet 未加载");
        const container = document.getElementById('dynamicEventsList');
        if (container) container.innerHTML = '<div class="error-msg">❌ 地图库加载失败，请检查网络后刷新页面。</div>';
        return;
    }
    if (typeof locations === 'undefined' || typeof eventsData === 'undefined') {
        console.error("数据未加载");
        const container = document.getElementById('dynamicEventsList');
        if (container) container.innerHTML = '<div class="error-msg">❌ 数据文件加载失败，请确保 js/data.js 存在且路径正确。</div>';
        return;
    }
    
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;
    
    try {
        if (mapInstance) mapInstance.remove();
        // 浅色底图更适合白色基底
        mapInstance = L.map('map').setView([35.0, 110.0], 5);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
            subdomains: 'abcd',
            maxZoom: 19,
            minZoom: 4
        }).addTo(mapInstance);
        
        const getColor = (type) => {
            if (type === "重大事件") return "#b32d2d";
            if (type === "长期居住") return "#5a7d9a";
            return "#6b8c6b";
        };
        
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
            
            const relatedEvents = eventsData.filter(ev => ev.location === loc.name);
            let popupContent = `<b>${loc.name}</b> (${loc.type})<br/>${loc.desc}<br/><br/><b>📅 相关事件:</b><ul>`;
            if (relatedEvents.length === 0) popupContent += `<li>无直接关联事件</li>`;
            else {
                relatedEvents.forEach(ev => {
                    const year = ev.start ? ev.start.slice(0,4) : '';
                    popupContent += `<li><strong>${ev.name}</strong> (${year})<br/>${ev.desc.substring(0,60)}...</li>`;
                });
            }
            popupContent += `</ul><button class="loc-jump" data-loc="${loc.name}" style="margin-top:8px; padding:4px 10px; background:#b32d2d; border:none; border-radius:20px; cursor:pointer; color:white;">🔍 查看时间轴</button>`;
            marker.bindPopup(popupContent);
            
            let tooltipText = `${loc.name} (${loc.type})\n`;
            if (relatedEvents.length > 0) tooltipText += relatedEvents.map(ev => ev.name).join(' · ');
            else tooltipText += '重要途经地';
            marker.bindTooltip(tooltipText, { sticky: true, direction: 'top' });
            
            marker.on('popupopen', () => {
                document.querySelectorAll('.loc-jump').forEach(btn => {
                    btn.onclick = () => {
                        window.location.href = `timeline.html?location=${encodeURIComponent(btn.getAttribute('data-loc'))}`;
                    };
                });
            });
            markers.push(marker);
        });
        
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
        }
        
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
        
        setTimeout(() => {
            if (mapInstance) {
                mapInstance.invalidateSize();
                mapInstance.setView([35.0, 110.0], 5);
            }
        }, 200);
    } catch (error) {
        console.error("地图初始化出错:", error);
        const container = document.getElementById('dynamicEventsList');
        if (container) container.innerHTML = `<div class="error-msg">❌ 地图初始化失败: ${error.message}<br>请尝试刷新页面。</div>`;
    }
}

document.addEventListener('DOMContentLoaded', initMap);
window.addEventListener('resize', () => { if (mapInstance) setTimeout(() => mapInstance.invalidateSize(), 100); });