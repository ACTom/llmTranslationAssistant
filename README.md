# LLM Translation Assistant

[中文版本](README_zh.md) | English

A Firefox extension that uses large language models to assist with translation on translation websites.

## Features

- 🤖 **AI-Powered Translation**: Supports multiple large language models including OpenAI, Anthropic, Google AI, and more
- 🌐 **Multi-Site Support**: Compatible with multiple mainstream translation platforms
- ⚙️ **Flexible Configuration**: Customizable API providers, models, and parameters
- 🌍 **Internationalization**: Supports both Chinese and English interfaces
- 🎨 **Modern UI**: Beautiful user interface with smooth interactive experience

## Supported Translation Sites

- [LibreOffice Translation Platform](https://translations.documentfoundation.org/)
- [LibreOffice Wiki](https://wiki.documentfoundation.org/)
- [Weblate](https://hosted.weblate.org/)
- Other Weblate systems (can be force-enabled)

## Supported AI Providers

- **OpenAI**: GPT-4, GPT-3.5 Turbo
- **Anthropic**: Claude 3 Sonnet, Claude 3 Haiku
- **Google AI**: Gemini Pro
- **Custom**: Supports any service compatible with OpenAI API format

## Installation

### Development Version

1. Clone or download this project locally
2. Open Firefox browser
3. Enter `about:debugging` in the address bar
4. Click "This Firefox"
5. Click "Load Temporary Add-on"
6. Select the `manifest.json` file in the project directory

### Release Version

The extension will be published to the Firefox Add-ons store for direct installation.

## Usage

### 1. Configure API Settings

After first installation, the extension will automatically open the settings page:

1. Select API provider (OpenAI, Anthropic, Google AI, or Custom)
2. Enter API key
3. Select or customize model name
4. Click Save

### 2. Use on Translation Sites

1. Visit a supported translation website
2. Find the translation text box
3. Click the "AI Translate" button
4. Review the AI-generated translation result
5. Click "Apply" to fill the translation into the text box

## Project Structure

```
LLMTranslationAssistant/
├── manifest.json           # Extension manifest file
├── background.js           # Background script
├── content.js             # Content script
├── content.css            # Content script styles
├── options.html           # Settings page
├── options.css            # Settings page styles
├── options.js             # Settings page script
├── popup.html             # Popup window
├── popup.css              # Popup window styles
├── popup.js               # Popup window script
├── site-configs.js        # Site configuration file
├── generate-icons.js      # Icon generation script
├── create-png-icons.html  # PNG icon creation page
├── icons/                 # Icon files
│   ├── icon.svg
│   ├── icon-16.svg
│   ├── icon-32.svg
│   ├── icon-48.svg
│   └── icon-128.svg
├── _locales/              # Internationalization files
│   ├── en/
│   │   └── messages.json
│   └── zh_CN/
│       └── messages.json
└── README.md              # Documentation
```

## Development

### Tech Stack

- **Firefox WebExtensions API**: Extension development framework
- **Vanilla JavaScript**: Dependency-free native JS
- **CSS3**: Modern CSS features and animations
- **SVG**: Vector icons

### Core Features

1. **Settings Management**: Uses `chrome.storage.sync` to store user configurations
2. **Content Injection**: Injects UI elements into translation sites through content scripts
3. **API Calls**: Unified interface supporting multiple AI services
4. **Internationalization**: Multi-language support using `chrome.i18n` API

### Extension Permissions

- `storage`: Store user settings
- `activeTab`: Access current tab
- `https://*/*`: Support other translation sites and API services

## Contributing

Issues and Pull Requests are welcome!

### Development Environment Setup

1. Fork this repository
2. Clone locally
3. Load the extension following the installation method
4. Modify code and test
5. Submit Pull Request

### Adding New Translation Site Support

1. Add site configuration in `site-configs.js`
2. Add logic for extracting source text for the new site in the `getSourceText` method in `content.js`
3. Add site permissions in `manifest.json`
4. Test functionality

## License

MIT License

## Contact

For questions or suggestions, please contact via:

- GitHub Issues: [Submit Issue](https://github.com/ACTom/llmTranslationAssistant/issues)