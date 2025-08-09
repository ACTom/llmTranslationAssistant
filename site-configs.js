// 网站特定配置
let SITE_CONFIGS = {
  // LibreOffice 翻译网站
  'translations.documentfoundation.org': {
    name: 'LibreOffice Weblate',
    selectors: {
      // 翻译文本区域选择器
      translationTextarea: [
        'textarea[name*="target"]',
        'textarea[id*="target"]',
        '.translation-form textarea:not([readonly])',
        'textarea.target'
      ],
      // 源文本选择器
      sourceText: [
        '[data-clone-value]',  // 最准确的源文本
        '.list-group-item-text span:not(.badge)',  // 显示的文本内容
        '.source-text',
        'textarea[readonly]',
        '.msgid',
        '[class*="source"]',
        '[class*="original"]'
      ],
      // 表单容器
      formContainer: 'form, .translation-form, .source-language-group'
    },
    // UI 注入配置
    ui: {
      buttonPosition: 'after', // after, before, inside
      buttonClass: 'llm-weblate-btn',
      containerClass: 'llm-weblate-container'
    },
    // 文本获取策略
    textExtraction: {
      // 获取源文本的方法优先级
      sourceTextMethods: [
        'dataCloneValue', 
        'listGroupItemText',  
        'readonlyTextarea',
        'sourceElements',
        'previousTextarea'
      ]
    }
  },

  // LibreOffice 维基
  'wiki.documentfoundation.org': {
    name: 'LibreOffice Wiki',
    selectors: {
      // 翻译文本区域选择器
      translationTextarea: [
        'textarea.tux-textarea-translation.mw-editfont-monospace',
        'textarea[class*="tux-textarea-translation"]'
      ],
      // 源文本选择器
      sourceText: [
        'span.sourcemessage.mw-editfont-monospace',
        '.twelve.columns.sourcemessage.mw-editfont-monospace',
        'span[class*="sourcemessage"]'
      ],
      // 表单容器
      formContainer: '.seven.columns.editcolumn, .row.tux-editor-actions-block, .tux-editor-actions-block'
    },
    // UI 注入配置
    ui: {
      buttonPosition: 'after', // after, before, inside
      buttonClass: 'llm-wiki-btn',
      containerClass: 'llm-wiki-container'
    },
    // 文本获取策略
    textExtraction: {
      // 获取源文本的方法优先级
      sourceTextMethods: [
        'spanSourceText',  // 从span元素获取源文本
        'sourceElements'
      ]
    }
  },

  // 默认配置（通用规则）
  'default': {
    name: 'Generic Site',
    selectors: {
      translationTextarea: [
        'textarea[name*="target"]',
        'textarea[name*="translation"]',
        'textarea[class*="target"]',
        'textarea[class*="translation"]',
        'textarea:not([readonly]):not([disabled])'
      ],
      sourceText: [
        '[data-clone-value]', 
        'textarea[readonly]',
        'textarea[disabled]',
        '[class*="source"]',
        '[class*="original"]',
        '.source-text'
      ],
      formContainer: 'form, .form, .translation-form'
    },
    ui: {
      buttonPosition: 'after',
      buttonClass: 'llm-generic-btn',
      containerClass: 'llm-generic-container'
    },
    textExtraction: {
      sourceTextMethods: [
        'dataCloneValue', 
        'readonlyTextarea',
        'sourceElements',
        'previousTextarea'
      ]
    }
  }
};

SITE_CONFIGS['hosted.weblate.org'] = SITE_CONFIGS['translations.documentfoundation.org'];
SITE_CONFIGS['hosted.weblate.org'].name = 'Weblate';

// 检查当前站点是否被支持
function isSiteSupported(hostname) {
  if (!hostname) {
    return false;
  }
  
  // 精确匹配
  if (SITE_CONFIGS[hostname] && hostname !== 'default') {
    return true;
  }
  
  // 部分匹配
  for (const domain in SITE_CONFIGS) {
    if (domain !== 'default' && hostname.includes(domain)) {
      return true;
    }
  }
  
  return false;
}

// 获取当前网站配置
function getCurrentSiteConfig() {
  const hostname = window.location.hostname;
  
  // 精确匹配
  if (SITE_CONFIGS[hostname]) {
    return SITE_CONFIGS[hostname];
  }
  
  // 部分匹配
  for (const domain in SITE_CONFIGS) {
    if (domain !== 'default' && hostname.includes(domain)) {
      return SITE_CONFIGS[domain];
    }
  }
  
  // 返回默认配置
  return SITE_CONFIGS['default'];
}

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SITE_CONFIGS, getCurrentSiteConfig, isSiteSupported };
} else {
  window.SITE_CONFIGS = SITE_CONFIGS;
  window.getCurrentSiteConfig = getCurrentSiteConfig;
  window.isSiteSupported = isSiteSupported;
}

// 确保在浏览器环境中不返回任何值
if (typeof window !== 'undefined') {
  undefined;
}