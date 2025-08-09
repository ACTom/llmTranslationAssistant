// 弹出窗口脚本

// 国际化函数
function loadI18n() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(key);
    if (message) {
      element.textContent = message;
    }
  });
}

// 加载并显示当前设置状态
function loadStatus() {
  chrome.storage.sync.get({
    apiProvider: 'openai',
    apiUrl: '',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    customModel: ''
  }, function(items) {
    // 显示API提供商
    const providerElement = document.getElementById('currentProvider');
    const providerNames = {
      'openai': 'OpenAI',
      'anthropic': 'Anthropic',
      'google': 'Google AI',
      'custom': 'Custom'
    };
    providerElement.textContent = providerNames[items.apiProvider] || items.apiProvider;
    
    // 显示模型
    const modelElement = document.getElementById('currentModel');
    const displayModel = items.customModel || items.model;
    modelElement.textContent = displayModel || 'Not set';
    
    // 显示API密钥状态
    const apiKeyElement = document.getElementById('apiKeyStatus');
    if (items.apiKey) {
      apiKeyElement.textContent = 'Configured';
      apiKeyElement.className = 'status-value configured';
    } else {
      apiKeyElement.textContent = 'Not configured';
      apiKeyElement.className = 'status-value not-configured';
    }
  });
}

// 打开设置页面
function openSettings() {
  chrome.runtime.openOptionsPage();
  window.close();
}

// 刷新状态
function refreshStatus() {
  const refreshBtn = document.getElementById('refreshStatus');
  refreshBtn.classList.add('loading');
  
  setTimeout(() => {
    loadStatus();
    refreshBtn.classList.remove('loading');
  }, 500);
}

// 检查当前标签页是否为支持的网站
function checkCurrentSite() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    if (currentTab && currentTab.url) {
      const supportedSites = [
        'translations.documentfoundation.org',
        'translate.wordpress.org',
        'crowdin.com',
        'lokalise.com',
        'weblate.org'
      ];
      
      const isSupportedSite = supportedSites.some(site => currentTab.url.includes(site));
      
      // 可以根据是否为支持的网站显示不同的UI
      if (isSupportedSite) {
        // 当前在支持的网站上
        document.body.classList.add('on-supported-site');
      } else {
        // 当前不在支持的网站上
        document.body.classList.add('not-on-supported-site');
      }
    }
  });
}

// 添加快捷操作按钮（如果在支持的网站上）
function addQuickActions() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    if (currentTab && currentTab.url) {
      const supportedSites = [
        'translations.documentfoundation.org',
        'translate.wordpress.org',
        'crowdin.com',
        'lokalise.com',
        'weblate.org'
      ];
      
      const isSupportedSite = supportedSites.some(site => currentTab.url.includes(site));
      
      if (isSupportedSite) {
        // 添加重新注入脚本的按钮
        const actionsDiv = document.querySelector('.actions');
        const reinjectBtn = document.createElement('button');
        reinjectBtn.className = 'btn btn-secondary';
        reinjectBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.35 0 4.48.9 6.07 2.38l1.43-1.43"></path>
            <path d="M17 8l4-4-4-4"></path>
          </svg>
          Reload Extension
        `;
        
        reinjectBtn.addEventListener('click', function() {
          // 重新注入内容脚本
          chrome.tabs.executeScript(currentTab.id, {
            file: 'content.js'
          }, function() {
            if (chrome.runtime.lastError) {
              console.error('Script injection failed:', chrome.runtime.lastError);
            } else {
              console.log('Content script reinjected successfully');
              window.close();
            }
          });
        });
        
        actionsDiv.appendChild(reinjectBtn);
      }
    }
  });
}

// 监听存储变化
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync') {
    // 设置发生变化时自动刷新状态
    loadStatus();
  }
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  // 加载国际化
  loadI18n();
  
  // 加载状态
  loadStatus();
  
  // 检查当前网站
  checkCurrentSite();
  
  // 添加快捷操作
  addQuickActions();
  
  // 绑定事件
  document.getElementById('openSettings').addEventListener('click', openSettings);
  document.getElementById('refreshStatus').addEventListener('click', refreshStatus);
});

// 处理键盘快捷键
document.addEventListener('keydown', function(e) {
  // Ctrl/Cmd + S 打开设置
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    openSettings();
  }
  
  // F5 或 Ctrl/Cmd + R 刷新状态
  if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'r')) {
    e.preventDefault();
    refreshStatus();
  }
  
  // Escape 关闭弹窗
  if (e.key === 'Escape') {
    window.close();
  }
});