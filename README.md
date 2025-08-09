# LLM Translation Assistant

一个Firefox扩展，用于在翻译网站上使用大语言模型来辅助翻译。

## 功能特性

- 🤖 **AI驱动翻译**: 支持OpenAI、Anthropic、Google AI等多种大语言模型
- 🌐 **多站点支持**: 支持多个主流翻译平台
- ⚙️ **灵活配置**: 可自定义API提供商、模型和参数
- 🌍 **国际化**: 支持中英文界面
- 🎨 **现代UI**: 美观的用户界面和流畅的交互体验

## 支持的翻译网站

- [LibreOffice翻译平台](https://translations.documentfoundation.org/)
- [WordPress翻译平台](https://translate.wordpress.org/)
- [Crowdin](https://crowdin.com/)
- [Lokalise](https://lokalise.com/)
- [Weblate](https://weblate.org/)

## 支持的AI提供商

- **OpenAI**: GPT-4, GPT-3.5 Turbo
- **Anthropic**: Claude 3 Sonnet, Claude 3 Haiku
- **Google AI**: Gemini Pro
- **自定义**: 支持任何兼容OpenAI API格式的服务

## 安装方法

### 开发版安装

1. 克隆或下载此项目到本地
2. 打开Firefox浏览器
3. 在地址栏输入 `about:debugging`
4. 点击「此Firefox」
5. 点击「临时载入附加组件」
6. 选择项目目录中的 `manifest.json` 文件

### 发布版安装

扩展将发布到Firefox Add-ons商店，届时可直接安装。

## 使用方法

### 1. 配置API设置

首次安装后，扩展会自动打开设置页面：

1. 选择API提供商（OpenAI、Anthropic、Google AI或自定义）
2. 输入API密钥
3. 选择或自定义模型名称
4. 点击保存

### 2. 在翻译网站使用

1. 访问支持的翻译网站
2. 找到翻译文本框
3. 点击「AI翻译」按钮
4. 查看AI生成的翻译结果
5. 点击「应用」按钮将翻译填入文本框

## 项目结构

```
LLMTranslationAssistant/
├── manifest.json           # 扩展清单文件
├── background.js           # 后台脚本
├── content.js             # 内容脚本
├── content.css            # 内容脚本样式
├── options.html           # 设置页面
├── options.css            # 设置页面样式
├── options.js             # 设置页面脚本
├── popup.html             # 弹出窗口
├── popup.css              # 弹出窗口样式
├── popup.js               # 弹出窗口脚本
├── icons/                 # 图标文件
│   └── icon.svg
├── _locales/              # 国际化文件
│   ├── en/
│   │   └── messages.json
│   └── zh_CN/
│       └── messages.json
└── README.md              # 说明文档
```

## 开发说明

### 技术栈

- **Firefox WebExtensions API**: 扩展开发框架
- **Vanilla JavaScript**: 无依赖的原生JS
- **CSS3**: 现代CSS特性和动画
- **SVG**: 矢量图标

### 核心功能

1. **设置管理**: 使用 `chrome.storage.sync` 存储用户配置
2. **内容注入**: 通过内容脚本在翻译网站注入UI元素
3. **API调用**: 支持多种AI服务的统一接口
4. **国际化**: 使用 `chrome.i18n` API实现多语言支持

### 扩展权限

- `storage`: 存储用户设置
- `activeTab`: 访问当前标签页
- `https://translations.documentfoundation.org/*`: 访问LibreOffice翻译平台
- `https://api.openai.com/*`: 调用OpenAI API
- `https://*/*`: 支持其他翻译网站和API服务

## 贡献指南

欢迎提交Issue和Pull Request！

### 开发环境设置

1. Fork此仓库
2. 克隆到本地
3. 按照安装方法加载扩展
4. 修改代码并测试
5. 提交Pull Request

### 添加新的翻译网站支持

1. 在 `content.js` 中的 `isTranslationTextarea` 方法添加网站检测逻辑
2. 在 `getSourceText` 方法中添加源文本提取逻辑
3. 在 `manifest.json` 中添加网站权限
4. 测试功能是否正常

## 许可证

MIT License

## 更新日志

### v1.0.0
- 初始版本发布
- 支持OpenAI、Anthropic、Google AI
- 支持LibreOffice翻译平台
- 中英文国际化支持
- 现代化UI设计

## 常见问题

### Q: 如何获取API密钥？

A: 
- **OpenAI**: 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
- **Anthropic**: 访问 [Anthropic Console](https://console.anthropic.com/)
- **Google AI**: 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)

### Q: 为什么翻译按钮没有出现？

A: 
1. 确保已正确配置API设置
2. 检查是否在支持的翻译网站上
3. 尝试刷新页面或重新加载扩展

### Q: 翻译质量如何提升？

A: 
1. 选择更强大的模型（如GPT-4）
2. 确保源文本清晰完整
3. 可以在设置中调整温度参数

## 联系方式

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [提交问题](https://github.com/your-username/LLMTranslationAssistant/issues)
- Email: your-email@example.com