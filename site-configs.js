// 网站特定配置
const SITE_CONFIGS = {
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
        'dataCloneValue',  // 新增：从data-clone-value获取
        'listGroupItemText',   // 新增：从列表项文本获取
        'readonlyTextarea',
        'sourceElements',
        'previousTextarea'
      ]
    }
  },

  // Google Translate
  'translate.google.com': {
    name: 'Google Translate',
    selectors: {
      translationTextarea: [
        '[data-language-for-alternatives]',
        'textarea[aria-label*="translation"]',
        '.tlid-translation textarea'
      ],
      sourceText: [
        '[data-language-for-alternatives="source"]',
        'textarea[aria-label*="source"]',
        '.tlid-source-text textarea'
      ],
      formContainer: '.tlid-translation, .translation-container'
    },
    ui: {
      buttonPosition: 'after',
      buttonClass: 'llm-google-btn',
      containerClass: 'llm-google-container'
    },
    textExtraction: {
      sourceTextMethods: [
        'sourceElements',
        'dataAttributes'
      ]
    }
  },

  // DeepL
  'www.deepl.com': {
    name: 'DeepL Translator',
    selectors: {
      translationTextarea: [
        '[data-testid="translator-target-input"]',
        '.lmt__target_textarea',
        'textarea[placeholder*="translation"]'
      ],
      sourceText: [
        '[data-testid="translator-source-input"]',
        '.lmt__source_textarea',
        'textarea[placeholder*="source"]'
      ],
      formContainer: '.lmt__sides_container'
    },
    ui: {
      buttonPosition: 'after',
      buttonClass: 'llm-deepl-btn',
      containerClass: 'llm-deepl-container'
    },
    textExtraction: {
      sourceTextMethods: [
        'sourceElements',
        'dataTestId'
      ]
    }
  },

  // Crowdin
  'crowdin.com': {
    name: 'Crowdin',
    selectors: {
      translationTextarea: [
        '.translation-input textarea',
        '[data-qa="translation-input"]',
        'textarea[name="translation"]'
      ],
      sourceText: [
        '.source-text',
        '[data-qa="source-text"]',
        '.original-text'
      ],
      formContainer: '.translation-editor, .editor-container'
    },
    ui: {
      buttonPosition: 'after',
      buttonClass: 'llm-crowdin-btn',
      containerClass: 'llm-crowdin-container'
    },
    textExtraction: {
      sourceTextMethods: [
        'sourceElements',
        'dataQa'
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
        'readonlyTextarea',
        'sourceElements',
        'previousTextarea'
      ]
    }
  }
};

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
  module.exports = { SITE_CONFIGS, getCurrentSiteConfig };
} else {
  window.SITE_CONFIGS = SITE_CONFIGS;
  window.getCurrentSiteConfig = getCurrentSiteConfig;
}