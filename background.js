// 后台脚本 - 处理扩展的后台逻辑

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 首次安装时打开设置页面
    chrome.runtime.openOptionsPage();
  }
});

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getSettings':
      // 获取设置
      chrome.storage.sync.get({
        apiProvider: 'openai',
        apiUrl: 'https://api.openai.com/v1/chat/completions',
        apiKey: '',
        model: 'gpt-3.5-turbo',
        customModel: ''
      }, (items) => {
        sendResponse(items);
      });
      return true; // 保持消息通道开放
      
    case 'openOptions':
      // 打开设置页面
      chrome.runtime.openOptionsPage();
      break;
      
    case 'translate':
      // 处理翻译请求
      handleTranslationRequest(request.data, sendResponse);
      return true; // 保持消息通道开放
      
    default:
      console.log('Unknown action:', request.action);
  }
});

// 处理翻译请求
async function handleTranslationRequest(data, sendResponse) {
  try {
    // 获取设置
    const settings = await new Promise((resolve) => {
      chrome.storage.sync.get({
        apiProvider: 'openai',
        apiUrl: 'https://api.openai.com/v1/chat/completions',
        apiKey: '',
        model: 'gpt-3.5-turbo',
        customModel: ''
      }, resolve);
    });
    
    if (!settings.apiKey) {
      throw new Error('API key not configured');
    }
    
    const model = settings.customModel || settings.model;
    
    // 构建请求体
    const requestBody = {
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Translate the given text accurately while maintaining the original meaning and context. Only return the translation without any additional explanation.'
        },
        {
          role: 'user',
          content: `Please translate the following text:\n\n${data.sourceText}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    };
    
    // 发送API请求
    const response = await fetch(settings.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.choices && result.choices[0] && result.choices[0].message) {
      sendResponse({
        success: true,
        translation: result.choices[0].message.content.trim()
      });
    } else {
      throw new Error('Invalid API response format');
    }
    
  } catch (error) {
    console.error('Translation error:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 当页面加载完成时，检查是否是支持的翻译网站
  if (changeInfo.status === 'complete' && tab.url) {
    const supportedSites = [
      'translations.documentfoundation.org',
      'translate.wordpress.org',
      'crowdin.com',
      'lokalise.com',
      'weblate.org'
    ];
    
    const isSupportedSite = supportedSites.some(site => tab.url.includes(site));
    
    if (isSupportedSite) {
      // 可以在这里添加特定网站的处理逻辑
      console.log('Detected supported translation site:', tab.url);
    }
  }
});

// 处理扩展图标点击
chrome.browserAction.onClicked.addListener((tab) => {
  // 检查当前标签页是否是支持的网站
  const supportedSites = [
    'translations.documentfoundation.org',
    'translate.wordpress.org',
    'crowdin.com',
    'lokalise.com',
    'weblate.org'
  ];
  
  const isSupportedSite = supportedSites.some(site => tab.url.includes(site));
  
  if (isSupportedSite) {
    // 在支持的网站上，重新注入内容脚本
    chrome.tabs.executeScript(tab.id, {
      file: 'content.js'
    });
  } else {
    // 在其他网站上，打开设置页面
    chrome.runtime.openOptionsPage();
  }
});

// 错误处理
chrome.runtime.onSuspend.addListener(() => {
  console.log('Extension is being suspended');
});

// 监听存储变化
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    console.log('Settings changed:', changes);
    // 可以在这里通知内容脚本设置已更改
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'settingsChanged',
          changes: changes
        }, () => {
          // 忽略错误（某些标签页可能没有内容脚本）
          chrome.runtime.lastError;
        });
      });
    });
  }
});