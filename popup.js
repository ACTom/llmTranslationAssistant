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
    modelElement.textContent = displayModel || chrome.i18n.getMessage('notSet');
    
    // 显示API密钥状态
    const apiKeyElement = document.getElementById('apiKeyStatus');
    if (items.apiKey) {
      apiKeyElement.textContent = chrome.i18n.getMessage('configured');
      apiKeyElement.className = 'status-value configured';
    } else {
      apiKeyElement.textContent = chrome.i18n.getMessage('notConfigured');
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
    checkCurrentSite(); // 同时更新站点支持状态
    refreshBtn.classList.remove('loading');
  }, 500);
}

// 检查当前标签页是否为支持的网站
function checkCurrentSite() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    if (currentTab && currentTab.url) {
      const hostname = new URL(currentTab.url).hostname;
      
      // 通过消息传递检查站点支持状态
      chrome.runtime.sendMessage({
        action: 'checkSiteSupport',
        hostname: hostname
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Failed to check site support:', chrome.runtime.lastError);
          updateSiteStatus(false, false);
          return;
        }
        
        const isSupported = response && response.supported;
        
        // 检查当前站点是否在强制开启列表中
        chrome.storage.sync.get(['forceEnabledSites'], function(items) {
          const forceEnabledSites = items.forceEnabledSites || [];
          const isForceEnabled = forceEnabledSites.includes(hostname);
          updateSiteStatus(isSupported, isForceEnabled);
        });
      });
    } else {
      updateSiteStatus(false, false);
    }
  });
}

// 更新站点支持状态显示
function updateSiteStatus(isSupported, forceEnabled) {
  const siteStatusElement = document.getElementById('siteSupported');
  const forceEnableContainer = document.getElementById('forceEnableContainer');
  const forceEnableCheckbox = document.getElementById('forceEnable');
  
  if (isSupported || forceEnabled) {
    if (isSupported) {
      siteStatusElement.textContent = chrome.i18n.getMessage('supported');
      forceEnableContainer.style.display = 'none';
    } else {
      siteStatusElement.textContent = chrome.i18n.getMessage('forceEnabled');
      forceEnableContainer.style.display = 'block';
      forceEnableCheckbox.checked = true;
    }
    siteStatusElement.className = 'status-value configured';
    document.body.classList.add('on-supported-site');
    document.body.classList.remove('not-on-supported-site');
  } else {
    siteStatusElement.textContent = chrome.i18n.getMessage('notSupported');
    siteStatusElement.className = 'status-value not-configured';
    forceEnableContainer.style.display = 'block';
    forceEnableCheckbox.checked = false;
    document.body.classList.add('not-on-supported-site');
    document.body.classList.remove('on-supported-site');
  }
}

// 添加快捷操作按钮（如果在支持的网站上）
function addQuickActions() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    if (currentTab && currentTab.url) {
      // 通过消息传递检查站点支持状态
      chrome.runtime.sendMessage({
        action: 'checkSiteSupport',
        hostname: new URL(currentTab.url).hostname
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Failed to check site support for quick actions:', chrome.runtime.lastError);
          return;
        }
        
        const isSupportedSite = response && response.supported;
        
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
          <span data-i18n="reloadExtension">${chrome.i18n.getMessage('reloadExtension')}</span>
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
      });
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
  
  // 绑定强制开启开关事件
  document.getElementById('forceEnable').addEventListener('change', function(e) {
    const forceEnabled = e.target.checked;
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      if (currentTab && currentTab.url) {
        const hostname = new URL(currentTab.url).hostname;
        
        // 获取当前强制开启的站点列表
        chrome.storage.sync.get(['forceEnabledSites'], function(items) {
          let forceEnabledSites = items.forceEnabledSites || [];
          
          if (forceEnabled) {
            // 添加当前站点到强制开启列表
            if (!forceEnabledSites.includes(hostname)) {
              forceEnabledSites.push(hostname);
            }
          } else {
            // 从强制开启列表中移除当前站点
            forceEnabledSites = forceEnabledSites.filter(site => site !== hostname);
          }
          
          // 保存更新后的列表
          chrome.storage.sync.set({ forceEnabledSites: forceEnabledSites }, function() {
            console.log('Force enabled sites updated:', forceEnabledSites);
            
            if (forceEnabled) {
              // 强制开启，需要重新注入脚本
              chrome.tabs.executeScript(currentTab.id, {
                file: 'site-configs.js'
              }, () => {
                if (!chrome.runtime.lastError) {
                  chrome.tabs.executeScript(currentTab.id, {
                    file: 'content.js'
                  }, () => {
                    if (!chrome.runtime.lastError) {
                      // 注入完成后，触发初始化
                      chrome.tabs.executeScript(currentTab.id, {
                        code: 'if (typeof initializeTranslationAssistant === "function") { initializeTranslationAssistant(); }'
                      }, () => {
                        if (!chrome.runtime.lastError) {
                          console.log('Scripts injected and initialized successfully for force enable');
                        }
                      });
                    }
                  });
                }
              });
              
              // 注入CSS
              chrome.tabs.insertCSS(currentTab.id, {
                file: 'content.css'
              }, () => {
                if (!chrome.runtime.lastError) {
                  console.log('CSS injected successfully for force enable');
                }
              });
            } else {
              // 关闭强制开启，清理翻译助手实例
              chrome.tabs.executeScript(currentTab.id, {
                code: `
                  if (window.translationAssistant) {
                    // 清理翻译按钮
                    const buttons = document.querySelectorAll('.translation-button-container');
                    buttons.forEach(button => button.remove());
                    
                    // 清理实例
                    window.translationAssistant = null;
                    translationAssistantInstance = null;
                    
                    console.log('Translation Assistant cleaned up due to force disable');
                  }
                `
              });
            }
          });
        });
      }
    });
  });
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