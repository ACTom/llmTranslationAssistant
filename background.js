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
      handleTranslationRequest(request, sendResponse);
      return true; // 保持消息通道开放
      
    case 'checkSiteSupport':
      // 检查站点支持状态
      const hostname = request.hostname;
      const isSupported = isSiteSupported(hostname);
      sendResponse({ supported: isSupported });
      break;
      
    default:
      console.log('Unknown action:', request.action);
  }
});

// 获取语言名称
function getLanguageName(langCode) {
  const languageMap = {
    'auto': 'Auto Detect',
    'zh': 'Chinese',
    'zh-CN': 'Simplified Chinese',
    'zh-TW': 'Traditional Chinese',
    'en': 'English',
    'ja': 'Japanese',
    'ko': 'Korean',
    'fr': 'French',
    'de': 'German',
    'es': 'Spanish',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ar': 'Arabic',
    'th': 'Thai',
    'vi': 'Vietnamese'
  };
  return languageMap[langCode] || langCode;
}

// 处理翻译请求
async function handleTranslationRequest(request, sendResponse) {
  try {
    // 获取设置
    const settings = await new Promise((resolve) => {
      chrome.storage.sync.get(null, resolve);
    });
    
    if (!settings.apiKey) {
      sendResponse({ error: 'API key not configured' });
      return;
    }
    
    // 调用翻译API
    const translation = await callTranslationAPI(request.sourceText, settings);
    sendResponse({ translation: translation });
  } catch (error) {
    console.error('Translation error:', error);
    sendResponse({ error: error.message });
  }
}

// 调用翻译API
async function callTranslationAPI(sourceText, settings) {
  const model = settings.customModel || settings.model;
  
  // 获取当前活跃的提示词模板
  const activePrompt = settings.prompts?.find(p => p.id === settings.activePromptId) || 
                      settings.prompts?.find(p => p.active) ||
                      {
                        content: 'Please translate the following {source_lang} text into {dest_lang}, maintaining the tone and style of the original text. If there are any specialized terms, please refer to the glossary: {glossary_list}\n\nOriginal text:'
                      };
  
  // 构建词汇表字符串
  const glossaryList = (settings.glossary || []).map(item => `${item.source} -> ${item.target}`).join(', ') || '无';
  
  // 获取语言名称
  const sourceLangName = getLanguageName(settings.sourceLang || 'auto');
  const targetLangName = getLanguageName(settings.targetLang || 'zh-CN');
  
  // 替换提示词中的占位符
  const promptContent = activePrompt.content
    .replace('{source_lang}', sourceLangName)
    .replace('{dest_lang}', targetLangName)
    .replace('{glossary_list}', glossaryList);
  
  const requestBody = {
    model: model,
    messages: [
      {
        role: 'user',
        content: `${promptContent}${sourceText}`
      }
    ],
    temperature: 0.3,
    // max_tokens: 1000
  };

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

  const data = await response.json();
  
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content.trim();
  } else {
    throw new Error('Invalid API response format');
  }
}

// 监听标签页更新

// 注入脚本到标签页
function injectScripts(tabId) {
  // 注入site-configs.js到页面（content script需要访问站点配置）
  chrome.tabs.executeScript(tabId, {
    file: 'site-configs.js'
  }, (result) => {
    if (!chrome.runtime.lastError) {
      console.log('Site configs injected successfully');
      
      // 然后注入content.js
      chrome.tabs.executeScript(tabId, {
        file: 'content.js'
      }, () => {
        if (!chrome.runtime.lastError) {
          console.log('Content script injected successfully');
        } else {
          console.error('Failed to inject content script:', chrome.runtime.lastError);
        }
      });
    } else {
      console.error('Failed to inject site configs:', chrome.runtime.lastError);
    }
  });
  
  // 注入CSS
  chrome.tabs.insertCSS(tabId, {
    file: 'content.css'
  }, () => {
    if (!chrome.runtime.lastError) {
      console.log('CSS injected successfully');
    } else {
      console.error('Failed to inject CSS:', chrome.runtime.lastError);
    }
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 当页面加载完成时，检查是否需要注入脚本
  if (changeInfo.status === 'complete' && tab.url) {
    const hostname = new URL(tab.url).hostname;
    
    // 检查是否应该注入脚本
    shouldInjectScripts(hostname, (shouldInject) => {
      if (shouldInject) {
        injectScripts(tabId);
        console.log('Scripts injected for site:', hostname);
      }
    });
  }
});

// 检查是否应该注入脚本
function shouldInjectScripts(hostname, callback) {
  // 使用导入的站点配置检查是否支持
  const isSupported = isSiteSupported(`${hostname}`);
  
  // 如果是支持的站点，直接注入
  if (isSupported) {
    callback(true);
    return;
  }
  
  // 如果不是支持的站点，检查是否在强制开启列表中
  chrome.storage.sync.get(['forceEnabledSites'], function(items) {
    const forceEnabledSites = items.forceEnabledSites || [];
    
    // 如果站点在强制开启列表中
    const shouldInject = forceEnabledSites.includes(hostname);
    callback(shouldInject);
  });
}

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