// 国际化加载
function loadI18n() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(key);
    if (message) {
      element.textContent = message;
    }
  });
  
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    const message = chrome.i18n.getMessage(key);
    if (message) {
      element.placeholder = message;
    }
  });
}

// API配置
const API_CONFIGS = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo']
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    models: ['claude-3-sonnet-20240229', 'claude-3-haiku-20240307', 'claude-3-opus-20240229']
  },
  google: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models',
    models: ['gemini-pro', 'gemini-pro-vision']
  }
};

// 默认提示词模板
const DEFAULT_PROMPTS = [
  {
    id: 'default',
    name: '默认翻译',
    content: '请将以下{source_lang}文本翻译成{dest_lang}，保持原文的语气和风格。如果有专业术语，请参考词汇表：{glossary_list}\n\n原文：',
    active: true
  },
  {
    id: 'formal',
    name: '正式翻译',
    content: '请将以下{source_lang}文本翻译成正式的{dest_lang}，使用标准的书面语。专业术语参考：{glossary_list}\n\n原文：',
    active: false
  },
  {
    id: 'casual',
    name: '口语化翻译',
    content: '请将以下{source_lang}文本翻译成口语化的{dest_lang}，使用日常对话的语气。术语参考：{glossary_list}\n\n原文：',
    active: false
  }
];

// 全局变量
let currentSettings = {
  // 基本设置
  sourceLang: 'auto',
  targetLang: 'zh',
  prompts: DEFAULT_PROMPTS,
  activePromptId: 'default',
  autoTranslate: false,
  
  // 模型设置
  apiProvider: 'openai',
  apiUrl: '',
  apiKey: '',
  model: 'gpt-3.5-turbo',
  customModel: '',
  
  // 词汇表
  glossary: []
};

// 标签页切换
function initTabs() {
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      
      // 更新导航状态
      navTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // 更新内容显示
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === targetTab + '-tab') {
          content.classList.add('active');
        }
      });
    });
  });
}

// 加载设置
function loadSettings() {
  chrome.storage.sync.get(null, function(items) {
    // 只更新存储中存在的设置，保留默认值
    if (Object.keys(items).length > 0) {
      currentSettings = { ...currentSettings, ...items };
    }
    
    // 加载基本设置
    const sourceLangEl = document.getElementById('sourceLang');
    const targetLangEl = document.getElementById('targetLang');
    const autoTranslateEl = document.getElementById('autoTranslate');
    if (sourceLangEl) sourceLangEl.value = currentSettings.sourceLang;
    if (targetLangEl) targetLangEl.value = currentSettings.targetLang;
    if (autoTranslateEl) autoTranslateEl.checked = currentSettings.autoTranslate;
    
    // 加载模型设置
    const apiProviderEl = document.getElementById('apiProvider');
    const apiUrlEl = document.getElementById('apiUrl');
    const apiKeyEl = document.getElementById('apiKey');
    const modelEl = document.getElementById('model');
    const customModelEl = document.getElementById('customModel');
    
    if (apiProviderEl) apiProviderEl.value = currentSettings.apiProvider;
    if (apiUrlEl) apiUrlEl.value = currentSettings.apiUrl;
    if (apiKeyEl) apiKeyEl.value = currentSettings.apiKey;
    if (modelEl) modelEl.value = currentSettings.model;
    if (customModelEl) customModelEl.value = currentSettings.customModel;
    
    // 更新UI
    updateProviderSettings(currentSettings.apiProvider);
    if (currentSettings.apiProvider !== 'custom') {
      updateModelSettings(currentSettings.model);
    }
    
    // 渲染提示词和词汇表
    renderPrompts();
    renderGlossary();
    
    // 更新设置显示
    displayCurrentSettings();
  });
}

// 保存设置
function saveSettings() {
  chrome.storage.sync.set(currentSettings, function() {
      if (chrome.runtime.lastError) {
        console.error('保存设置失败:', chrome.runtime.lastError);
        showStatus('保存设置失败: ' + chrome.runtime.lastError.message, 'error');
      } else {
        console.log('设置已保存:', currentSettings);
        showStatus('设置已保存');
        // 更新设置显示
        displayCurrentSettings();
      }
    });
}

// 显示状态消息
function showStatus(message, type = 'success') {
  const status = document.getElementById('status');
  if (status) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }
}

// 模型设置相关函数
function updateProviderSettings(provider) {
  const customApiGroup = document.getElementById('customApiGroup');
  const modelGroup = document.getElementById('modelGroup');
  const customModelGroup = document.getElementById('customModelGroup');
  const modelSelect = document.getElementById('model');
  
  if (provider === 'custom') {
    customApiGroup.style.display = 'block';
    modelGroup.style.display = 'none';
    customModelGroup.style.display = 'block';
  } else {
    customApiGroup.style.display = 'none';
    modelGroup.style.display = 'block';
    
    if (API_CONFIGS[provider]) {
      document.getElementById('apiUrl').value = API_CONFIGS[provider].url;
      
      modelSelect.innerHTML = '';
      API_CONFIGS[provider].models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
      });
      
      const customOption = document.createElement('option');
      customOption.value = 'custom';
      customOption.textContent = chrome.i18n.getMessage('customProvider') || 'Custom';
      modelSelect.appendChild(customOption);
    }
    
    updateModelSettings(modelSelect.value);
  }
}

function updateModelSettings(selectedModel) {
  const customModelGroup = document.getElementById('customModelGroup');
  
  if (selectedModel === 'custom') {
    customModelGroup.style.display = 'block';
  } else {
    customModelGroup.style.display = 'none';
  }
}

// 提示词管理
function renderPrompts() {
  const promptList = document.getElementById('promptList');
  promptList.innerHTML = '';
  
  currentSettings.prompts.forEach(prompt => {
    const promptItem = document.createElement('div');
    promptItem.className = `prompt-item ${prompt.active ? 'active' : ''}`;
    
    const promptHeader = document.createElement('div');
    promptHeader.className = 'prompt-header';
    
    const promptName = document.createElement('span');
    promptName.className = 'prompt-name';
    promptName.textContent = prompt.name;
    
    const promptActions = document.createElement('div');
    promptActions.className = 'prompt-actions';
    
    if (!prompt.active) {
      const setActiveBtn = document.createElement('button');
      setActiveBtn.type = 'button';
      setActiveBtn.className = 'btn-small btn-success';
      setActiveBtn.textContent = '设为当前';
      setActiveBtn.addEventListener('click', () => setActivePrompt(prompt.id));
      promptActions.appendChild(setActiveBtn);
    } else {
      const currentSpan = document.createElement('span');
      currentSpan.className = 'btn-small btn-secondary';
      currentSpan.textContent = '当前使用';
      promptActions.appendChild(currentSpan);
    }
    
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-small';
    editBtn.textContent = '编辑';
    editBtn.addEventListener('click', () => editPrompt(prompt.id));
    promptActions.appendChild(editBtn);
    
    if (prompt.id !== 'default') {
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn-small btn-danger';
      deleteBtn.textContent = '删除';
      deleteBtn.addEventListener('click', () => deletePrompt(prompt.id));
      promptActions.appendChild(deleteBtn);
    }
    
    promptHeader.appendChild(promptName);
    promptHeader.appendChild(promptActions);
    
    const promptContent = document.createElement('div');
    promptContent.className = 'prompt-content';
    promptContent.textContent = prompt.content;
    
    promptItem.appendChild(promptHeader);
    promptItem.appendChild(promptContent);
    promptList.appendChild(promptItem);
  });
}

function addPrompt() {
  createModal('添加提示词', [
    { label: '提示词名称', placeholder: '请输入提示词名称' },
    { label: '提示词内容', type: 'textarea', placeholder: '请输入提示词内容（可使用 {source_lang}, {dest_lang}, {glossary_list} 占位符）' }
  ], (values) => {
    const [name, content] = values;
    
    const newPrompt = {
      id: Date.now().toString(),
      name: name,
      content: content,
      active: false
    };
    
    currentSettings.prompts.push(newPrompt);
    renderPrompts();
    saveSettings();
    showStatus('提示词添加成功');
  });
}

function editPrompt(id) {
  const prompt = currentSettings.prompts.find(p => p.id === id);
  if (!prompt) return;
  
  createModal('编辑提示词', [
    { label: '提示词名称', placeholder: '请输入提示词名称', value: prompt.name },
    { label: '提示词内容', type: 'textarea', placeholder: '请输入提示词内容', value: prompt.content }
  ], (values) => {
    const [newName, newContent] = values;
    
    prompt.name = newName;
    prompt.content = newContent;
    
    renderPrompts();
    saveSettings();
    showStatus('提示词修改成功');
  });
}

function deletePrompt(id) {
  if (!confirm('确定要删除这个提示词吗？')) return;
  
  currentSettings.prompts = currentSettings.prompts.filter(p => p.id !== id);
  renderPrompts();
  saveSettings();
}

function setActivePrompt(id) {
  currentSettings.prompts.forEach(p => p.active = false);
  const prompt = currentSettings.prompts.find(p => p.id === id);
  if (prompt) {
    prompt.active = true;
    currentSettings.activePromptId = id;
  }
  
  renderPrompts();
  saveSettings();
}

// 词汇表管理
function renderGlossary() {
  const glossaryList = document.getElementById('glossaryList');
  const searchElement = document.getElementById('searchGlossary');
  const searchTerm = searchElement ? searchElement.value.toLowerCase() : '';
  
  const filteredGlossary = currentSettings.glossary.filter(item => 
    item.source.toLowerCase().includes(searchTerm) || 
    item.target.toLowerCase().includes(searchTerm)
  );
  
  glossaryList.innerHTML = '';
  
  if (filteredGlossary.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.style.padding = '20px';
    emptyDiv.style.textAlign = 'center';
    emptyDiv.style.color = '#666';
    emptyDiv.textContent = '暂无词汇';
    glossaryList.appendChild(emptyDiv);
    return;
  }
  
  filteredGlossary.forEach((item, index) => {
    const originalIndex = currentSettings.glossary.findIndex(glossaryItem => 
      glossaryItem.source === item.source && glossaryItem.target === item.target
    );
    
    const glossaryItem = document.createElement('div');
    glossaryItem.className = 'glossary-item';
    
    const glossaryTerms = document.createElement('div');
    glossaryTerms.className = 'glossary-terms';
    
    const glossarySource = document.createElement('div');
    glossarySource.className = 'glossary-source';
    glossarySource.textContent = item.source;
    
    const glossaryTarget = document.createElement('div');
    glossaryTarget.className = 'glossary-target';
    glossaryTarget.textContent = item.target;
    
    glossaryTerms.appendChild(glossarySource);
    glossaryTerms.appendChild(glossaryTarget);
    
    const glossaryActions = document.createElement('div');
    glossaryActions.className = 'glossary-actions';
    
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-small';
    editBtn.textContent = '编辑';
    editBtn.addEventListener('click', () => editGlossary(originalIndex));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-small btn-danger';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', () => deleteGlossary(originalIndex));
    
    glossaryActions.appendChild(editBtn);
    glossaryActions.appendChild(deleteBtn);
    
    glossaryItem.appendChild(glossaryTerms);
    glossaryItem.appendChild(glossaryActions);
    glossaryList.appendChild(glossaryItem);
  });
}

function addGlossary() {
  createModal('添加词汇', [
    { label: '原文词汇', placeholder: '请输入原文词汇' },
    { label: '译文词汇', placeholder: '请输入译文词汇' }
  ], (values) => {
    const [source, target] = values;
    
    currentSettings.glossary.push({ source, target });
    renderGlossary();
    saveSettings();
    showStatus('词汇添加成功');
  });
}

function editGlossary(index) {
  const item = currentSettings.glossary[index];
  if (!item) return;
  
  createModal('编辑词汇', [
    { label: '原文词汇', placeholder: '请输入原文词汇', value: item.source },
    { label: '译文词汇', placeholder: '请输入译文词汇', value: item.target }
  ], (values) => {
    const [newSource, newTarget] = values;
    
    currentSettings.glossary[index] = { source: newSource, target: newTarget };
    renderGlossary();
    saveSettings();
    showStatus('词汇修改成功');
  });
}

function deleteGlossary(index) {
  if (!confirm('确定要删除这个词汇吗？')) return;
  
  currentSettings.glossary.splice(index, 1);
  renderGlossary();
  saveSettings();
}

// 导入导出功能
function exportSettings() {
  const exportData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    settings: currentSettings
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `llm-translation-settings-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
  showStatus('设置已导出', 'success');
}

function importSettings() {
  document.getElementById('importFile').click();
}

function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importData = JSON.parse(e.target.result);
      
      if (!importData.settings) {
        throw new Error('无效的设置文件格式');
      }
      
      // 合并设置
      currentSettings = { ...currentSettings, ...importData.settings };
      
      // 保存并重新加载
      chrome.storage.sync.set(currentSettings, function() {
        loadSettings();
        showImportStatus('设置导入成功！', 'success');
        // 更新设置显示
        displayCurrentSettings();
      });
      
    } catch (error) {
      showImportStatus('导入失败：' + error.message, 'error');
    }
  };
  
  reader.readAsText(file);
}

function showImportStatus(message, type) {
  const status = document.getElementById('importStatus');
  status.textContent = message;
  status.className = type;
  
  setTimeout(() => {
    status.className = '';
    status.textContent = '';
  }, 5000);
}

// 显示当前设置信息
function displayCurrentSettings() {
  const display = document.getElementById('currentSettingsDisplay');
  if (display) {
    try {
      const settingsJson = JSON.stringify(currentSettings, null, 2);
      display.value = settingsJson;
    } catch (error) {
      display.value = '无法显示设置信息：' + error.message;
    }
  }
}

// 创建模态对话框
function createModal(title, fields, callback) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${title}</h3>
        <span class="close">&times;</span>
      </div>
      <div class="modal-body">
        ${fields.map((field, index) => `
          <div class="form-group">
            <label for="modal-input-${index}">${field.label}:</label>
            ${field.type === 'textarea' ? 
              `<textarea id="modal-input-${index}" placeholder="${field.placeholder || ''}" rows="4">${field.value || ''}</textarea>` :
              `<input type="text" id="modal-input-${index}" placeholder="${field.placeholder || ''}" value="${field.value || ''}">`
            }
          </div>
        `).join('')}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="modal-cancel">取消</button>
        <button class="btn btn-primary" id="modal-confirm">确定</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // 显示模态框
  modal.style.display = 'block';
  
  const closeModal = () => {
    document.body.removeChild(modal);
  };
  
  modal.querySelector('.close').onclick = closeModal;
  modal.querySelector('#modal-cancel').onclick = closeModal;
  
  modal.querySelector('#modal-confirm').onclick = () => {
    const values = fields.map((_, index) => {
      return document.getElementById(`modal-input-${index}`).value;
    });
    
    if (values.every(v => v.trim())) {
      callback(values);
      closeModal();
    }
  };
  
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };
  
  // 聚焦第一个输入框
  setTimeout(() => {
    const firstInput = modal.querySelector('input, textarea');
    if (firstInput) firstInput.focus();
  }, 100);
}

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
  loadI18n();
  initTabs();
  loadSettings();
  
  // 初始显示当前设置
  displayCurrentSettings();
  
  // 基本设置按钮
  const saveBasicBtn = document.getElementById('saveBasicBtn');
  if (saveBasicBtn) {
    saveBasicBtn.addEventListener('click', function(e) {
      e.preventDefault();
      currentSettings.sourceLang = document.getElementById('sourceLang').value;
      currentSettings.targetLang = document.getElementById('targetLang').value;
      currentSettings.autoTranslate = document.getElementById('autoTranslate').checked;
      saveSettings();
    });
  }
  
  // 模型设置按钮
  const saveModelBtn = document.getElementById('saveModelBtn');
  if (saveModelBtn) {
    saveModelBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const provider = document.getElementById('apiProvider').value;
      let model, customModel;
      
      if (provider === 'custom') {
        model = document.getElementById('customModel').value;
        customModel = document.getElementById('customModel').value;
      } else {
        const selectedModel = document.getElementById('model').value;
        if (selectedModel === 'custom') {
          model = document.getElementById('customModel').value;
          customModel = document.getElementById('customModel').value;
        } else {
          model = selectedModel;
          customModel = document.getElementById('customModel').value;
        }
      }
      
      currentSettings.apiProvider = provider;
      currentSettings.apiUrl = provider === 'custom' ? 
        document.getElementById('apiUrl').value : 
        API_CONFIGS[provider]?.url || '';
      currentSettings.apiKey = document.getElementById('apiKey').value;
      currentSettings.model = model;
      currentSettings.customModel = customModel;
      
      saveSettings();
    });
  }
  
  // 事件监听器
  const apiProvider = document.getElementById('apiProvider');
  if (apiProvider) {
    apiProvider.addEventListener('change', function() {
      updateProviderSettings(this.value);
    });
  }
  
  const modelSelect = document.getElementById('model');
  if (modelSelect) {
    modelSelect.addEventListener('change', function() {
      updateModelSettings(this.value);
    });
  }
  
  const addPromptBtn = document.getElementById('addPrompt');
  if (addPromptBtn) {
    addPromptBtn.addEventListener('click', addPrompt);
  }
  
  const addGlossaryBtn = document.getElementById('addGlossary');
  if (addGlossaryBtn) {
    addGlossaryBtn.addEventListener('click', addGlossary);
  }
  
  const glossarySearch = document.getElementById('searchGlossary');
  if (glossarySearch) {
    glossarySearch.addEventListener('input', renderGlossary);
  }
  
  const exportBtn = document.getElementById('exportSettings');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportSettings);
  }
  
  const importBtn = document.getElementById('importSettings');
  if (importBtn) {
    importBtn.addEventListener('click', importSettings);
  }
  
  const importFile = document.getElementById('importFile');
  if (importFile) {
    importFile.addEventListener('change', handleImportFile);
  }
  
  // 刷新设置显示按钮
  const refreshBtn = document.getElementById('refreshSettings');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', displayCurrentSettings);
  }
});

// 不再需要暴露函数到全局作用域，因为我们使用addEventListener