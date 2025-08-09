# 安装指南 - LLM Translation Assistant

## 快速开始

### 1. 准备工作

在开始之前，请确保您有：
- Firefox浏览器（版本57或更高）
- 一个支持的AI服务API密钥（OpenAI、Anthropic、Google AI等）

### 2. 安装扩展

#### 方法一：开发者模式安装（推荐用于测试）

1. **下载项目文件**
   ```bash
   git clone <repository-url>
   cd LLMTranslationAssistant
   ```

2. **生成PNG图标**（可选）
   - 在浏览器中打开 `create-png-icons.html`
   - 点击「Generate All Icons」
   - 点击「Download All」下载所有尺寸的PNG图标
   - 将下载的PNG文件放入 `icons/` 文件夹

3. **在Firefox中加载扩展**
   - 打开Firefox浏览器
   - 在地址栏输入 `about:debugging`
   - 点击左侧的「此Firefox」
   - 点击「临时载入附加组件」
   - 选择项目目录中的 `manifest.json` 文件
   - 扩展将被加载并显示在扩展列表中

#### 方法二：打包安装

1. **创建扩展包**
   ```bash
   # 在项目根目录执行
   zip -r llm-translation-assistant.zip . -x "*.git*" "node_modules/*" "*.md" "test.html" "create-png-icons.html" "generate-icons.js"
   ```

2. **安装扩展包**
   - 在Firefox地址栏输入 `about:addons`
   - 点击设置图标（齿轮）
   - 选择「从文件安装附加组件」
   - 选择生成的 `.zip` 文件

### 3. 配置API设置

安装完成后，扩展会自动打开设置页面：

1. **选择API提供商**
   - OpenAI（推荐）
   - Anthropic
   - Google AI
   - 自定义（支持兼容OpenAI API的服务）

2. **输入API密钥**
   - 从对应的AI服务提供商获取API密钥
   - 粘贴到「API Key」字段

3. **选择模型**
   - 根据您的需求选择合适的模型
   - 或在「Custom Model Name」中输入自定义模型名称

4. **保存设置**
   - 点击「Save」按钮
   - 看到成功提示后即可开始使用

### 4. 使用扩展

1. **访问支持的翻译网站**
   - [LibreOffice翻译平台](https://translations.documentfoundation.org/)
   - [WordPress翻译平台](https://translate.wordpress.org/)
   - 其他支持的平台

2. **查找翻译界面**
   - 找到需要翻译的文本
   - 在翻译文本框附近会出现「AI翻译」按钮

3. **使用AI翻译**
   - 点击「AI翻译」按钮
   - 等待AI生成翻译结果
   - 查看翻译质量
   - 点击「应用」将翻译填入文本框

## 获取API密钥

### OpenAI
1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册或登录账户
3. 前往 [API Keys](https://platform.openai.com/api-keys)
4. 点击「Create new secret key」
5. 复制生成的密钥

### Anthropic
1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 注册或登录账户
3. 前往API Keys页面
4. 创建新的API密钥
5. 复制密钥

### Google AI
1. 访问 [Google AI Studio](https://makersuite.google.com/)
2. 登录Google账户
3. 前往API Key页面
4. 创建新的API密钥
5. 复制密钥

## 故障排除

### 扩展无法加载
- 确保Firefox版本支持WebExtensions（版本57+）
- 检查manifest.json文件是否存在语法错误
- 查看Firefox开发者工具的控制台错误信息

### AI翻译按钮不出现
- 确保已正确配置API设置
- 检查是否在支持的翻译网站上
- 尝试刷新页面
- 在扩展管理页面重新加载扩展

### 翻译请求失败
- 检查API密钥是否正确
- 确认API服务可用性
- 检查网络连接
- 查看浏览器控制台的错误信息

### 翻译质量不佳
- 尝试使用更强大的模型（如GPT-4）
- 确保源文本清晰完整
- 检查源文本是否被正确识别

## 开发者信息

### 项目结构
```
LLMTranslationAssistant/
├── manifest.json           # 扩展清单
├── background.js           # 后台脚本
├── content.js             # 内容脚本
├── content.css            # 内容样式
├── options.html           # 设置页面
├── options.css            # 设置样式
├── options.js             # 设置脚本
├── popup.html             # 弹出窗口
├── popup.css              # 弹出样式
├── popup.js               # 弹出脚本
├── icons/                 # 图标文件
├── _locales/              # 国际化文件
└── README.md              # 项目说明
```

### 调试模式
1. 在Firefox中按F12打开开发者工具
2. 在控制台中查看扩展日志
3. 使用 `about:debugging` 查看扩展详情
4. 检查后台页面的控制台输出

### 自定义配置
扩展支持自定义API端点，您可以：
- 使用本地部署的AI模型
- 连接到企业内部的AI服务
- 使用其他兼容OpenAI API格式的服务

## 更新扩展

### 开发版更新
1. 拉取最新代码
2. 在 `about:debugging` 页面点击扩展的「重新载入」按钮

### 发布版更新
扩展发布到Firefox Add-ons后将支持自动更新。

## 卸载扩展

1. 前往 `about:addons`
2. 找到「LLM Translation Assistant」
3. 点击「移除」按钮
4. 确认卸载

扩展数据（包括API设置）将被完全清除。

## 支持与反馈

如果您遇到问题或有改进建议：

1. 查看 [常见问题](README.md#常见问题)
2. 提交 [GitHub Issue](https://github.com/your-username/LLMTranslationAssistant/issues)
3. 发送邮件至：your-email@example.com

感谢您使用LLM Translation Assistant！