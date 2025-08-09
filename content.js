// 翻译助手类
class TranslationAssistant {
  constructor() {
    this.settings = null;
    this.isInitialized = false;
    this.siteConfig = getCurrentSiteConfig();
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.injectUI();
    this.isInitialized = true;
  }

  // 加载设置
  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({
        // 基本设置
        sourceLang: 'auto',
        targetLang: 'zh',
        prompts: [],
        activePromptId: 'default',
        autoTranslate: false,
        // 模型设置
        apiProvider: 'openai',
        apiUrl: 'https://api.openai.com/v1/chat/completions',
        apiKey: '',
        model: 'gpt-3.5-turbo',
        customModel: '',
        // 词汇表
        glossary: []
      }, (items) => {
        this.settings = items;
        resolve();
      });
    });
  }

  // 注入UI元素
  injectUI() {
    // 使用网站特定的选择器查找翻译文本区域
    const selectors = this.siteConfig.selectors.translationTextarea;
    let textareas = [];
    
    // 尝试每个选择器
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      textareas.push(...elements);
    }
    
    // 去重
    textareas = [...new Set(textareas)];
    
    textareas.forEach((textarea, index) => {
      // 额外验证是否是翻译输入框
      if (this.isTranslationTextarea(textarea)) {
        this.addTranslationButton(textarea, index);
      }
    });
  }

  // 判断是否为翻译文本区域
  isTranslationTextarea(textarea) {
    // 检查是否为只读或禁用状态（通常不是目标翻译区域）
    if (textarea.readOnly || textarea.disabled) {
      return false;
    }
    
    // 通用验证：检查是否包含翻译相关的类名、ID或属性
    const hasTranslationIndicators = 
      textarea.className.includes('translation') || 
      textarea.className.includes('target') ||
      textarea.id.includes('translation') ||
      textarea.name.includes('translation') ||
      textarea.name.includes('target');
    
    // 检查是否在翻译相关的容器中
    const formContainer = this.siteConfig.selectors.formContainer;
    const inTranslationContainer = textarea.closest(formContainer);
    
    // 检查是否有对应的源文本元素
    const hasSourceText = this.findSourceText(textarea) !== '';
    
    return hasTranslationIndicators || (inTranslationContainer && hasSourceText);
  }

  // 添加翻译按钮
  addTranslationButton(textarea, index) {
    // 避免重复添加
    if (textarea.dataset.llmAssistantAdded) return;
    textarea.dataset.llmAssistantAdded = 'true';

    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = `llm-assistant-container ${this.siteConfig.ui.containerClass}`;
    buttonContainer.innerHTML = `
      <button type="button" class="llm-translate-btn ${this.siteConfig.ui.buttonClass}" data-textarea-index="${index}">
        ${chrome.i18n.getMessage('translate') || 'AI Translate'}
      </button>
      <div class="llm-result-container" style="display: none;">
        <div class="llm-source-text" style="margin-bottom: 10px; padding: 8px; background: #f8f9fa; border-left: 3px solid #007bff; font-size: 12px; color: #6c757d;">
          <strong>原文:</strong> <span class="llm-source-content"></span>
        </div>
        <div class="llm-result-text"></div>
        <button type="button" class="llm-apply-btn">
          ${chrome.i18n.getMessage('apply') || 'Apply'}
        </button>
      </div>
    `;

    // 根据网站配置决定插入位置
    this.insertButtonContainer(textarea, buttonContainer);

    // 绑定事件
    const translateBtn = buttonContainer.querySelector('.llm-translate-btn');
    const applyBtn = buttonContainer.querySelector('.llm-apply-btn');
    const resultContainer = buttonContainer.querySelector('.llm-result-container');
    const resultText = buttonContainer.querySelector('.llm-result-text');

    translateBtn.addEventListener('click', () => {
      this.handleTranslate(textarea, translateBtn, resultContainer, resultText);
    });

    applyBtn.addEventListener('click', () => {
      this.applyTranslation(textarea, resultText, resultContainer);
    });

    // 检查自动翻译设置
    if (this.settings && this.settings.autoTranslate) {
      // 延迟执行，确保UI完全渲染
      setTimeout(() => {
        translateBtn.click();
      }, 100);
    }
  }

  // 插入按钮容器
  insertButtonContainer(textarea, buttonContainer) {
    const position = this.siteConfig.ui.buttonPosition;
    
    switch (position) {
      case 'before':
        textarea.parentNode.insertBefore(buttonContainer, textarea);
        break;
      case 'inside':
        // 在textarea内部添加（需要特殊处理）
        textarea.parentNode.appendChild(buttonContainer);
        break;
      case 'after':
      default:
        textarea.parentNode.insertBefore(buttonContainer, textarea.nextSibling);
        break;
    }
  }

  // 查找源文本（用于验证）
  findSourceText(targetTextarea) {
    const selectors = this.siteConfig.selectors.sourceText;
    const container = targetTextarea.closest(this.siteConfig.selectors.formContainer) || document;
    
    for (const selector of selectors) {
      const elements = container.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.tagName === 'TEXTAREA' || element.tagName === 'INPUT' 
          ? element.value.trim() 
          : element.textContent.trim();
        if (text) {
          return text;
        }
      }
    }
    
    return '';
  }

  // 处理翻译请求
  async handleTranslate(textarea, button, resultContainer, resultText) {
    if (!this.settings.apiKey) {
      alert(chrome.i18n.getMessage('configureFirst') || 'Please configure API settings first');
      chrome.runtime.openOptionsPage();
      return;
    }

    // 获取源文本
    const sourceText = this.getSourceText(textarea);
    if (!sourceText) {
      alert('No source text found');
      return;
    }

    // 显示原文
    const sourceContent = resultContainer.querySelector('.llm-source-content');
    if (sourceContent) {
      sourceContent.textContent = sourceText;
    }

    // 更新按钮状态
    const originalText = button.textContent;
    button.textContent = chrome.i18n.getMessage('translating') || 'Translating...';
    button.disabled = true;

    // 先显示容器，让用户看到原文
    resultContainer.style.display = 'block';

    try {
      const translation = await this.callTranslationAPI(sourceText);
      resultText.textContent = translation;
    } catch (error) {
      console.error('Translation error:', error);
      alert(chrome.i18n.getMessage('error') || 'Translation error: ' + error.message);
    } finally {
      button.textContent = originalText;
      button.disabled = false;
    }
  }

  // 获取源文本
  getSourceText(targetTextarea) {
    const container = targetTextarea.closest(this.siteConfig.selectors.formContainer) || document;
    const methods = this.siteConfig.textExtraction.sourceTextMethods;
    
    for (const method of methods) {
      let sourceText = '';
      
      switch (method) {
        case 'dataClipboardValue':
          sourceText = this.getSourceTextFromDataClipboardValue(container);
          break;
        case 'listGroupItemText':
          sourceText = this.getSourceTextFromListGroupItemText(container);
          break;
        case 'sourceElements':
          sourceText = this.getSourceTextFromElements(container);
          break;
        case 'readonlyTextarea':
          sourceText = this.getSourceTextFromReadonlyTextarea(container);
          break;
        case 'previousTextarea':
          sourceText = this.getSourceTextFromPreviousTextarea(targetTextarea, container);
          break;
        case 'dataAttributes':
          sourceText = this.getSourceTextFromDataAttributes(container);
          break;
        case 'dataTestId':
          sourceText = this.getSourceTextFromDataTestId(container);
          break;
        case 'dataQa':
          sourceText = this.getSourceTextFromDataQa(container);
          break;
      }
      
      if (sourceText) {
        return sourceText;
      }
    }
    
    return '';
  }

  // 从源文本元素获取文本
  getSourceTextFromElements(container) {
    const selectors = this.siteConfig.selectors.sourceText;
    
    for (const selector of selectors) {
      const elements = container.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.tagName === 'TEXTAREA' || element.tagName === 'INPUT' 
          ? element.value.trim() 
          : element.textContent.trim();
        if (text) {
          return text;
        }
      }
    }
    
    return '';
  }

  // 从只读textarea获取文本
  getSourceTextFromReadonlyTextarea(container) {
    const readonlyTextareas = container.querySelectorAll('textarea[readonly], textarea[disabled]');
    for (const textarea of readonlyTextareas) {
      if (textarea.value.trim()) {
        return textarea.value.trim();
      }
    }
    return '';
  }

  // 从前一个textarea获取文本
  getSourceTextFromPreviousTextarea(targetTextarea, container) {
    const allTextareas = Array.from(container.querySelectorAll('textarea'));
    const currentIndex = allTextareas.indexOf(targetTextarea);
    if (currentIndex > 0) {
      return allTextareas[currentIndex - 1].value.trim();
    }
    return '';
  }

  // 从data属性获取文本
  getSourceTextFromDataAttributes(container) {
    const elements = container.querySelectorAll('[data-language-for-alternatives="source"]');
    for (const element of elements) {
      const text = element.tagName === 'TEXTAREA' || element.tagName === 'INPUT' 
        ? element.value.trim() 
        : element.textContent.trim();
      if (text) {
        return text;
      }
    }
    return '';
  }

  // 从data-testid获取文本
  getSourceTextFromDataTestId(container) {
    const elements = container.querySelectorAll('[data-testid*="source"]');
    for (const element of elements) {
      const text = element.tagName === 'TEXTAREA' || element.tagName === 'INPUT' 
        ? element.value.trim() 
        : element.textContent.trim();
      if (text) {
        return text;
      }
    }
    return '';
  }

  // 从data-qa获取文本
  getSourceTextFromDataQa(container) {
    const elements = container.querySelectorAll('[data-qa*="source"]');
    for (const element of elements) {
      const text = element.tagName === 'TEXTAREA' || element.tagName === 'INPUT' 
        ? element.value.trim() 
        : element.textContent.trim();
      if (text) {
        return text;
      }
    }
    return '';
  }

  // 从data-clipboard-value获取文本（LibreOffice Weblate专用）
  getSourceTextFromDataClipboardValue(container) {
    const elements = container.querySelectorAll('[data-clipboard-value]');
    for (const element of elements) {
      const clipboardValue = element.getAttribute('data-clipboard-value');
      if (clipboardValue && clipboardValue.trim()) {
        return clipboardValue.trim();
      }
    }
    return '';
  }

  // 从列表项文本获取（LibreOffice Weblate专用）
  getSourceTextFromListGroupItemText(container) {
    // 查找 .list-group-item-text 中的 span 元素，排除 .badge 类
    const elements = container.querySelectorAll('.list-group-item-text span:not(.badge)');
    for (const element of elements) {
      const text = element.textContent.trim();
      if (text) {
        return text;
      }
    }
    return '';
  }

  // 获取语言名称
  getLanguageName(langCode) {
    const languageMap = {
      'auto': '自动检测',
      'zh': '中文',
      'zh-CN': '简体中文',
      'zh-TW': '繁体中文',
      'en': '英语',
      'ja': '日语',
      'ko': '韩语',
      'fr': '法语',
      'de': '德语',
      'es': '西班牙语',
      'it': '意大利语',
      'pt': '葡萄牙语',
      'ru': '俄语',
      'ar': '阿拉伯语',
      'th': '泰语',
      'vi': '越南语'
    };
    return languageMap[langCode] || langCode;
  }

  // 调用翻译API
  async callTranslationAPI(sourceText) {
    const model = this.settings.customModel || this.settings.model;
    
    // 获取当前活跃的提示词模板
    const activePrompt = this.settings.prompts.find(p => p.id === this.settings.activePromptId) || 
                        this.settings.prompts.find(p => p.active) ||
                        {
                          content: '请将以下{source_lang}文本翻译成{dest_lang}，保持原文的语气和风格。如果有专业术语，请参考词汇表：{glossary_list}\n\n原文：'
                        };
    
    // 构建词汇表字符串
    const glossaryList = this.settings.glossary.map(item => `${item.source} -> ${item.target}`).join(', ') || '无';
    
    // 获取语言名称
    const sourceLangName = this.getLanguageName(this.settings.sourceLang);
    const targetLangName = this.getLanguageName(this.settings.targetLang);
    
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
      max_tokens: 1000
    };

    const response = await fetch(this.settings.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.settings.apiKey}`
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

  // 应用翻译结果
  applyTranslation(textarea, resultText, resultContainer) {
    textarea.value = resultText.textContent;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    resultContainer.style.display = 'none';
  }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new TranslationAssistant();
  });
} else {
  new TranslationAssistant();
}

// 监听动态内容变化
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const textareas = node.querySelectorAll ? node.querySelectorAll('textarea') : [];
          if (textareas.length > 0 && window.translationAssistant) {
            setTimeout(() => window.translationAssistant.injectUI(), 100);
          }
        }
      });
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});