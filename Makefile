# LLM Translation Assistant - Build Script

# Extension name and version
EXT_NAME = llmTranslationAssistant
VERSION = $(shell grep '"version"' manifest.json | sed 's/.*"version": "\([^"]*\)".*/\1/')

# Output directory and file
BUILD_DIR = build
XPI_FILE = $(BUILD_DIR)/$(EXT_NAME)-$(VERSION).xpi

# Files to include in the extension
SOURCE_FILES = manifest.json \
               background.js \
               content.js \
               content.css \
               options.html \
               options.css \
               options.js \
               popup.html \
               popup.css \
               popup.js \
               site-configs.js \
               icons/ \
               _locales/

# Default target
all: build

# Create build directory
build-dir:
	@mkdir -p $(BUILD_DIR)

# Build the XPI file
build: build-dir
	@echo "Building $(EXT_NAME) v$(VERSION)..."
	@rm -f $(XPI_FILE)
	@zip -r $(XPI_FILE) $(SOURCE_FILES) -x "*.DS_Store" "*/.DS_Store" "*/Thumbs.db"
	@echo "Extension built: $(XPI_FILE)"
	@echo "File size: $$(du -h $(XPI_FILE) | cut -f1)"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf $(BUILD_DIR)
	@echo "Clean complete."

# Install extension for development (requires web-ext)
install-dev:
	@echo "Installing extension for development..."
	@web-ext run --source-dir=. --browser=firefox

# Lint the extension (requires web-ext)
lint:
	@echo "Linting extension..."
	@web-ext lint --source-dir=.

# Package with web-ext (alternative method)
package-web-ext: $(BUILD_DIR)
	@echo "Packaging with web-ext..."
	@web-ext build --source-dir=. --artifacts-dir=$(BUILD_DIR) --overwrite-dest

# Show extension info
info:
	@echo "Extension: $(EXT_NAME)"
	@echo "Version: $(VERSION)"
	@echo "Output: $(XPI_FILE)"
	@echo "Source files:"
	@for file in $(SOURCE_FILES); do echo "  - $$file"; done

# Help target
help:
	@echo "Available targets:"
	@echo "  build        - Build the XPI file (default)"
	@echo "  clean        - Remove build artifacts"
	@echo "  install-dev  - Install for development (requires web-ext)"
	@echo "  lint         - Lint the extension (requires web-ext)"
	@echo "  package-web-ext - Package using web-ext tool"
	@echo "  info         - Show extension information"
	@echo "  help         - Show this help message"

# Declare phony targets
.PHONY: all build clean install-dev lint package-web-ext info help