// 既然脚本已经被 background.js 注入到页面，说明应该启用翻译助手
// 不需要再做额外的判断

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
        // 只保留 content.js 需要的基本设置
        autoTranslate: false
      }, (items) => {
        this.settings = items;
        resolve();
      });
    });
  }

  // 注入UI元素
  injectUI() {
    // 清理可能存在的旧按钮（避免重复）
    this.cleanupOldButtons();
    
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
    
    // 如果没有找到textarea，记录但不再重试（避免无限循环）
    if (textareas.length === 0) {
      console.log('LLM Translation Assistant: No translation textareas found');
      return;
    }
    
    textareas.forEach((textarea, index) => {
      // 额外验证是否是翻译输入框
      if (this.isTranslationTextarea(textarea)) {
        this.addTranslationButton(textarea, index);
      }
    });
  }
  
  // 清理旧的按钮
  cleanupOldButtons() {
    // 移除所有现有的翻译助手按钮和容器
    const oldContainers = document.querySelectorAll('.llm-assistant-container');
    oldContainers.forEach(container => container.remove());
    
    // 重置所有textarea的标记
    const allTextareas = document.querySelectorAll('textarea');
    allTextareas.forEach(textarea => {
      delete textarea.dataset.llmAssistantAdded;
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
        ${chrome.i18n.getMessage('translateButton') || 'AI Translate'}
      </button>
      <div class="llm-result-container" style="display: none;">
        <div class="llm-source-text" style="margin-bottom: 10px; padding: 8px; background: #f8f9fa; border-left: 3px solid #007bff; font-size: 12px; color: #6c757d;">
          <strong>${chrome.i18n.getMessage('originalText') || 'Original: '}</strong> <span class="llm-source-content"></span>
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
      // 通过消息传递给 background.js 处理翻译
      const translation = await this.requestTranslation(sourceText);
      resultText.textContent = translation;
    } catch (error) {
      console.error('Translation error:', error);
      // 如果是 API 配置错误，提示用户配置
      if (error.message.includes('API key not configured')) {
        alert(chrome.i18n.getMessage('configureFirst') || 'Please configure API settings first');
        chrome.runtime.openOptionsPage();
      } else {
        alert(chrome.i18n.getMessage('error') || 'Translation error: ' + error.message);
      }
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
        case 'dataCloneValue':
          sourceText = this.getSourceTextFromDataCloneValue(container);
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
  // 从data-clone-value获取文本（LibreOffice Weblate专用）
  getSourceTextFromDataCloneValue(container) {
    const elements = container.querySelectorAll('[data-clone-value]');
    for (const element of elements) {
      const clipboardValue = element.getAttribute('data-clone-value');
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

  // 请求翻译（通过 background.js）
  async requestTranslation(sourceText) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'translate',
        sourceText: sourceText
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.translation);
        }
      });
    });
  }

  // 应用翻译结果
  applyTranslation(textarea, resultText, resultContainer) {
    textarea.value = resultText.textContent;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    resultContainer.style.display = 'none';
  }
}

// 全局变量存储实例
let translationAssistantInstance = null;
let isInitializing = false;
let lastInjectTime = 0;

// 初始化函数
function initializeTranslationAssistant() {
  if (isInitializing) return;
  
  if (!translationAssistantInstance) {
    isInitializing = true;
    
    try {
      // 既然脚本被注入，直接初始化翻译助手
      translationAssistantInstance = new TranslationAssistant();
      window.translationAssistant = translationAssistantInstance;
      console.log('Translation Assistant initialized');
    } catch (error) {
      console.error('Failed to initialize Translation Assistant:', error);
    } finally {
      isInitializing = false;
    }
  } else {
    // 防止频繁重新注入（至少间隔1秒）
    const now = Date.now();
    if (now - lastInjectTime > 1000) {
      lastInjectTime = now;
      translationAssistantInstance.injectUI();
    }
  }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTranslationAssistant);
} else {
  initializeTranslationAssistant();
}

// 延迟初始化，确保动态内容加载完成（仅针对wiki站点）
if (window.location.hostname === 'wiki.documentfoundation.org') {
  setTimeout(initializeTranslationAssistant, 2000);
}

// 监听动态内容变化
const observer = new MutationObserver((mutations) => {
  let shouldReinject = false;
  
  mutations.forEach((mutation) => {
    // 监听子元素变化
    if (mutation.type === 'childList') {
      // 检查新增的节点
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // 忽略我们自己添加的按钮容器
          if (node.classList && node.classList.contains('llm-assistant-container')) {
            return;
          }
          
          // 检查是否包含翻译相关元素
          const hasTextarea = node.querySelector && node.querySelector('textarea.tux-textarea-translation');
          const hasSourceText = node.querySelector && node.querySelector('.sourcemessage');
          if (hasTextarea || hasSourceText) {
            shouldReinject = true;
          }
        }
      });
      
      // 检查移除的节点（仅当移除的是翻译相关元素时）
      mutation.removedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // 忽略我们自己移除的按钮容器
          if (node.classList && node.classList.contains('llm-assistant-container')) {
            return;
          }
          
          // 只有当移除的是翻译相关元素时才重新注入
          const wasTranslationElement = node.querySelector && (
            node.querySelector('textarea.tux-textarea-translation') ||
            node.querySelector('.sourcemessage') ||
            node.classList.contains('tux-textarea-translation') ||
            node.classList.contains('sourcemessage')
          );
          if (wasTranslationElement) {
            shouldReinject = true;
          }
        }
      });
    }
    
    // 监听属性变化（更精确的条件）
    if (mutation.type === 'attributes') {
      const target = mutation.target;
      // 只监听翻译相关元素的重要属性变化
      if (target.classList && (
          target.classList.contains('sourcemessage') || 
          target.classList.contains('tux-textarea-translation')
        ) && mutation.attributeName === 'class') {
        shouldReinject = true;
      }
    }
  });
  
  if (shouldReinject && translationAssistantInstance) {
    // 使用防抖，避免频繁重新注入
    clearTimeout(window.reinjectTimeout);
    window.reinjectTimeout = setTimeout(() => {
      const now = Date.now();
      if (now - lastInjectTime > 1000) {
        lastInjectTime = now;
        translationAssistantInstance.injectUI();
      }
    }, 500);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class', 'style']
});

// 监听特定于wiki.documentfoundation.org的事件
if (window.location.hostname === 'wiki.documentfoundation.org') {
  // 监听可能的翻译界面切换事件
  document.addEventListener('click', (e) => {
    // 检查是否点击了翻译相关的按钮
    if (e.target.matches('.tux-editor-skip-button, .tux-editor-save-button')) {
      setTimeout(() => {
        if (translationAssistantInstance) {
          const now = Date.now();
          if (now - lastInjectTime > 1000) {
            lastInjectTime = now;
            translationAssistantInstance.injectUI();
          }
        }
      }, 1000);
    }
  });
  
  // 监听键盘快捷键（CTRL+ENTER等）
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || e.key === 'd')) {
      setTimeout(() => {
        if (translationAssistantInstance) {
          const now = Date.now();
          if (now - lastInjectTime > 1000) {
            lastInjectTime = now;
            translationAssistantInstance.injectUI();
          }
        }
      }, 1000);
    }
  });
}