// ==================== AI 问答模块（基于DeepSeek长上下文） ====================

let DEEPSEEK_API_KEY, API_URL;
if (typeof window.DEEPSEEK_API_KEY !== 'undefined') {
    DEEPSEEK_API_KEY = window.DEEPSEEK_API_KEY;
    API_URL = window.API_URL || 'https://api.deepseek.com/v1/chat/completions';
}

async function askAI(question) {
    const answerFromKB = searchKnowledgeBase(question);
    if (answerFromKB) return answerFromKB;
    
    // 如果没有配置 API Key，则告知用户
    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'your-api-key-here') {
        return "⚠️ 未配置 DeepSeek API Key。请复制 config.js.example 为 config.js 并填入有效密钥，或联系项目成员获取。当前仅能回答知识库内的问题。";
    }
    
    
    // 2. 如果知识库没有，则调用DeepSeek API，但只发送知识库摘要，而非全书
    const context = buildContextFromKB(question);
    
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: `你是埃德加·斯诺研究专家。请基于以下知识回答问题。如果知识库中没有相关信息，请明确告知“书中没有提及”。知识库如下：\n\n${context}`
                },
                { role: 'user', content: question }
            ],
            temperature: 0.2,
            max_tokens: 800
        })
    });
    const data = await response.json();
    return data.choices[0].message.content;
}

// 知识库检索函数
function searchKnowledgeBase(question) {
    const q = question.toLowerCase();
    // 检查人物
    for (let [name, bio] of Object.entries(knowledgeBase.persons)) {
        if (q.includes(name) || (name.length > 1 && q.includes(name.slice(0,2)))) {
            return `${name}：${bio}`;
        }
    }
    // 检查事件
    for (let [name, desc] of Object.entries(knowledgeBase.events)) {
        if (q.includes(name) || q.includes(name.slice(0,4))) {
            return `${name}：${desc}`;
        }
    }
    // 检查地点
    for (let [name, desc] of Object.entries(knowledgeBase.locations)) {
        if (q.includes(name)) return `${name}：${desc}`;
    }
    // 检查著作
    for (let [name, desc] of Object.entries(knowledgeBase.works)) {
        if (q.includes(name)) return `${name}：${desc}`;
    }
    // 检查语录
    for (let quote of knowledgeBase.quotes) {
        if (q.includes(quote.slice(0,20))) return `斯诺曾说：“${quote}”`;
    }
    return null;
}

// 构建上下文（将知识库转换为文本）
function buildContextFromKB(question) {
    let ctx = "【人物】\n";
    for (let [k,v] of Object.entries(knowledgeBase.persons)) ctx += `- ${k}: ${v}\n`;
    ctx += "\n【事件】\n";
    for (let [k,v] of Object.entries(knowledgeBase.events)) ctx += `- ${k}: ${v}\n`;
    ctx += "\n【地点】\n";
    for (let [k,v] of Object.entries(knowledgeBase.locations)) ctx += `- ${k}: ${v}\n`;
    ctx += "\n【著作】\n";
    for (let [k,v] of Object.entries(knowledgeBase.works)) ctx += `- ${k}: ${v}\n`;
    ctx += "\n【语录】\n";
    for (let q of knowledgeBase.quotes) ctx += `- "${q}"\n`;
    return ctx;
}

// ==================== 悬浮球UI和交互（与之前相同） ====================
(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAIChat);
    } else {
        initAIChat();
    }

    function initAIChat() {
        if (document.getElementById('ai-chat-container')) return;
        
        const chatHTML = `
            <div id="ai-chat-container">
                <div id="ai-chat-ball" class="ai-chat-ball">
                    <i class="fas fa-comment-dots"></i>
                </div>
                <div id="ai-chat-window" class="ai-chat-window" style="display: none;">
                    <div class="ai-chat-header">
                        <span>斯诺足迹助手</span>
                        <button id="ai-chat-close" class="ai-chat-close">&times;</button>
                    </div>
                    <div class="ai-chat-messages" id="ai-chat-messages">
                        <div class="ai-message">你好！我是基于《我在旧中国十三年》和《复始之旅》的智能助手。你可以问我关于斯诺在中国的任何问题，比如：“斯诺在萨拉齐看到了什么？”“斯诺和鲁迅的关系？”</div>
                    </div>
                    <div class="ai-chat-input-area">
                        <input type="text" id="ai-chat-input" placeholder="输入你的问题..." />
                        <button id="ai-chat-send">发送</button>
                    </div>
                </div>
            </div>
        `;
        
        const div = document.createElement('div');
        div.innerHTML = chatHTML;
        document.body.appendChild(div.firstElementChild);
        
        const ball = document.getElementById('ai-chat-ball');
        const windowDiv = document.getElementById('ai-chat-window');
        const closeBtn = document.getElementById('ai-chat-close');
        const sendBtn = document.getElementById('ai-chat-send');
        const input = document.getElementById('ai-chat-input');
        const messagesDiv = document.getElementById('ai-chat-messages');
        
        ball.addEventListener('click', () => {
            windowDiv.style.display = 'flex';
            ball.style.opacity = '0';
            ball.style.pointerEvents = 'none';
        });
        closeBtn.addEventListener('click', () => {
            windowDiv.style.display = 'none';
            ball.style.opacity = '1';
            ball.style.pointerEvents = 'auto';
        });
        
        function addMessage(text, sender, isTemp = false) {
            const msgDiv = document.createElement('div');
            msgDiv.className = sender === 'user' ? 'user-message' : 'ai-message';
            if (isTemp) msgDiv.classList.add('thinking');
            msgDiv.textContent = text;
            messagesDiv.appendChild(msgDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        let isWaiting = false;
        
        async function sendMessage() {
            if (isWaiting) return;
            const question = input.value.trim();
            if (!question) return;
            
            addMessage(question, 'user');
            input.value = '';
            isWaiting = true;
            
            addMessage('正在翻阅书籍，请稍候...', 'ai', true);
            const thinkingMsg = messagesDiv.querySelector('.ai-message.thinking');
            
            try {
                const answer = await askAI(question);
                if (thinkingMsg) thinkingMsg.remove();
                addMessage(answer, 'ai');
            } catch (error) {
                if (thinkingMsg) thinkingMsg.remove();
                addMessage(`❌ 请求失败：${error.message}。请检查API密钥和网络。`, 'ai');
                console.error(error);
            } finally {
                isWaiting = false;
            }
        }
        
        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
})();