// NoDoxxing Content Script - Automatically redacts sensitive data

class NoDoxxingRedactor {
  constructor() {
    this.isEnabled = true;
    this.contrastModeEnabled = true; // Default enabled as per requirement
    this.patterns = {
      // Email addresses
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      
      // Phone numbers (various formats)
      phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
      
      // Credit card numbers (basic pattern)
      creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
      
      // SSN (XXX-XX-XXXX format)
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      
      // IP addresses
      ip: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
      
      // GitHub usernames (when preceded by @ or github.com/)
      github: /(github\.com\/|@)([a-zA-Z0-9]([a-zA-Z0-9\-]){0,38})/g,
      
      // Addresses (basic street address pattern) - put before names to avoid conflict
      address: /\b\d+\s+[A-Za-z0-9\s]+\s+(Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Court|Ct|Boulevard|Blvd)\b/gi,
      
      // Common name patterns (when in specific contexts)
      names: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g
    };
    
    this.sensitiveKeywords = [
      'password', 'secret', 'key', 'token', 'auth', 'login',
      'personal', 'private', 'confidential', 'sensitive'
    ];
    
    // Initialize user-defined strings array
    this.userStrings = [];
    this.userPatterns = [];
    
    this.init();
  }

  init() {
    // Check if extension is enabled and load user strings and contrast mode setting
    chrome.storage.sync.get(['nodoxxingEnabled', 'userStrings', 'contrastModeEnabled'], (result) => {
      this.isEnabled = result.nodoxxingEnabled !== false; // Default to enabled
      this.contrastModeEnabled = result.contrastModeEnabled !== false; // Default to enabled
      this.userStrings = result.userStrings || []; // Default to empty array
      this.updateUserPatterns();
      if (this.isEnabled) {
        this.startRedaction();
      } else {
        // If disabled, remove processing class immediately
        this.revealPage();
      }
    });

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (changes.nodoxxingEnabled) {
        this.isEnabled = changes.nodoxxingEnabled.newValue;
        if (this.isEnabled) {
          // Hide page again for re-processing
          if (document.body) {
            document.body.classList.add('nodoxxing-processing');
          }
          this.startRedaction();
        } else {
          this.restoreOriginalContent();
          this.revealPage();
        }
      }
      
      // Update user strings when they change
      if (changes.userStrings) {
        this.userStrings = changes.userStrings.newValue || [];
        this.updateUserPatterns();
        // Re-process content if extension is enabled
        if (this.isEnabled) {
          // Hide page again for re-processing
          if (document.body) {
            document.body.classList.add('nodoxxing-processing');
          }
          this.restoreOriginalContent();
          this.startRedaction();
        }
      }
      
      // Update contrast mode when it changes
      if (changes.contrastModeEnabled) {
        this.contrastModeEnabled = changes.contrastModeEnabled.newValue;
        // Re-process content if extension is enabled
        if (this.isEnabled) {
          if (document.body) {
            document.body.classList.add('nodoxxing-processing');
          }
          this.restoreOriginalContent();
          this.startRedaction();
        }
      }
    });
  }

  updateUserPatterns() {
    // Convert user strings to case-insensitive regex patterns
    this.userPatterns = this.userStrings.map(userString => {
      // Escape special regex characters in user string
      const escapedString = userString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Use word boundaries for better matching - but be careful with special chars
      return new RegExp(`\\b${escapedString}\\b`, 'gi');
    });
  }

  startRedaction() {
    // Hide page during processing
    this.hidePage();
    
    // Process current content first
    this.processTextNodes();
    
    // Set up observer for dynamic content
    this.setupMutationObserver();
    
    // Only reveal page after initial processing is complete
    // Use a small delay to ensure any synchronous processing has finished
    setTimeout(() => {
      this.revealPage();
    }, 10);
  }

  hidePage() {
    // Add the processing class to hide the page
    if (document.body) {
      document.body.classList.add('nodoxxing-processing');
    }
  }

  revealPage() {
    // Remove the processing class to show the page
    if (document.body) {
      document.body.classList.remove('nodoxxing-processing');
    }
  }

  processTextNodes() {
    this.processElementTextNodes(document.body);
  }

  processTextNode(textNode) {
    // Skip if already processed or if parent is redacted
    if (!textNode || !textNode.parentElement || 
        textNode.parentElement.classList.contains('nodoxxing-redacted') ||
        textNode.parentElement.dataset.nodoxxingProcessed) {
      return;
    }

    let content = textNode.textContent;
    let hasRedactions = false;
    let originalContent = content;

    // Apply all redaction patterns
    for (const [patternName, pattern] of Object.entries(this.patterns)) {
      if (pattern.test(content)) {
        hasRedactions = true;
        content = content.replace(pattern, (match) => {
          return `REDACTED`;
        });
      }
    }

    // Apply user-defined string redactions
    if (this.userPatterns.length > 0) {
      for (const userPattern of this.userPatterns) {
        if (userPattern.test(content)) {
          hasRedactions = true;
          content = content.replace(userPattern, 'REDACTED');
        }
      }
    }

    // Check for sensitive keywords in context
    if (this.hasSensitiveContext(originalContent)) {
      // Be more aggressive with redaction in sensitive contexts
      const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      if (emailPattern.test(content)) {
        hasRedactions = true;
        content = content.replace(emailPattern, 'REDACTED');
      }
    }

    if (hasRedactions) {
      // Store original content for potential restoration
      if (!textNode.parentElement.dataset.originalContent) {
        textNode.parentElement.dataset.originalContent = originalContent;
      }
      
      // Mark as processed
      textNode.parentElement.dataset.nodoxxingProcessed = 'true';
      
      // Create redacted span element
      const redactedSpan = document.createElement('span');
      redactedSpan.className = 'nodoxxing-redacted';
      redactedSpan.textContent = content;
      redactedSpan.title = 'Sensitive data redacted by NoDoxxing extension';
      
      // Apply contrast-aware styling
      const parentBgColor = this.getElementBackgroundColor(textNode.parentElement);
      const contrastColors = this.getContrastColors(parentBgColor);
      
      // Apply the contrast colors directly to the element
      redactedSpan.style.backgroundColor = contrastColors.backgroundColor;
      redactedSpan.style.color = contrastColors.color;
      redactedSpan.style.borderColor = contrastColors.borderColor;
      
      // Replace text node with redacted span
      textNode.parentElement.replaceChild(redactedSpan, textNode);
    } else {
      // Do not mark parent element as processed if no redactions occur
      // This ensures dynamic content added later can still be scanned.
    }
  }

  hasSensitiveContext(content) {
    // Check if content contains sensitive keywords that might indicate personal info
    const lowerContent = content.toLowerCase();
    
    for (const keyword of this.sensitiveKeywords) {
      if (lowerContent.includes(keyword)) {
        return true;
      }
    }
    
    return false;
  }

  // Color analysis functions for contrast mode
  getElementBackgroundColor(element) {
    // Walk up the DOM tree to find the effective background color
    let currentElement = element;
    while (currentElement && currentElement !== document.body) {
      const computedStyle = window.getComputedStyle(currentElement);
      const backgroundColor = computedStyle.backgroundColor;
      
      // If we find a non-transparent background color, use it
      if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
        return backgroundColor;
      }
      
      currentElement = currentElement.parentElement;
    }
    
    // Default to body background color or white
    const bodyStyle = window.getComputedStyle(document.body);
    const bodyBg = bodyStyle.backgroundColor;
    return (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)' && bodyBg !== 'transparent') ? bodyBg : 'rgb(255, 255, 255)';
  }

  parseRgbColor(colorString) {
    // Parse various color formats to RGB values
    if (colorString.startsWith('rgb(')) {
      const values = colorString.match(/\d+/g);
      return values ? values.map(Number) : [255, 255, 255];
    } else if (colorString.startsWith('rgba(')) {
      const values = colorString.match(/[\d.]+/g);
      return values ? values.slice(0, 3).map(Number) : [255, 255, 255];
    } else if (colorString.startsWith('#')) {
      const hex = colorString.slice(1);
      if (hex.length === 3) {
        return [
          parseInt(hex[0] + hex[0], 16),
          parseInt(hex[1] + hex[1], 16),
          parseInt(hex[2] + hex[2], 16)
        ];
      } else if (hex.length === 6) {
        return [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16)
        ];
      }
    }
    
    // Default to white if parsing fails
    return [255, 255, 255];
  }

  calculateLuminance(r, g, b) {
    // Calculate relative luminance using sRGB color space
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  getContrastColors(backgroundColor) {
    if (!this.contrastModeEnabled) {
      // Return default colors if contrast mode is disabled
      return {
        backgroundColor: '#000000',
        color: '#ffffff',
        borderColor: '#333333'
      };
    }

    const [r, g, b] = this.parseRgbColor(backgroundColor);
    const luminance = this.calculateLuminance(r, g, b);
    
    // Determine if background is light or dark (threshold of 0.5)
    const isLightBackground = luminance > 0.5;
    
    if (isLightBackground) {
      // Light background: use dark redaction with light text
      return {
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        borderColor: '#333333'
      };
    } else {
      // Dark background: use light redaction with dark text
      return {
        backgroundColor: '#f0f0f0',
        color: '#1a1a1a',
        borderColor: '#cccccc'
      };
    }
  }

  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      if (!this.isEnabled) return;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              this.processTextNode(node);
            } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('nodoxxing-redacted')) {
              // Process text nodes within the added element
              this.processElementTextNodes(node);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.mutationObserver = observer;
  }

  disconnectMutationObserver() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }
  processElementTextNodes(element) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script and style tags
          const parent = node.parentElement;
          if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip already processed nodes
          if (parent.classList.contains('nodoxxing-redacted') || 
              parent.dataset.nodoxxingProcessed) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Only process text nodes with actual content
          return node.textContent.trim().length > 0 ? 
            NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    textNodes.forEach(textNode => this.processTextNode(textNode));
  }

  restoreOriginalContent() {
    // Find all elements that have original content stored or are marked as processed
    const elementsWithOriginalContent = document.querySelectorAll('[data-original-content], [data-nodoxxing-processed]');
    
    elementsWithOriginalContent.forEach(element => {
      // Find redacted spans within this element
      const redactedSpans = element.querySelectorAll('.nodoxxing-redacted');
      
      if (redactedSpans.length > 0 && element.dataset.originalContent) {
        // Restore original text content
        element.textContent = element.dataset.originalContent;
        delete element.dataset.originalContent;
      }
      
      // Remove processing marker
      if (element.dataset.nodoxxingProcessed) {
        delete element.dataset.nodoxxingProcessed;
      }
    });
    
    // Also remove any standalone redacted elements
    const standaloneRedacted = document.querySelectorAll('.nodoxxing-redacted');
    standaloneRedacted.forEach(span => {
      const parent = span.parentElement;
      if (parent && parent.dataset.originalContent) {
        parent.textContent = parent.dataset.originalContent;
        delete parent.dataset.originalContent;
        if (parent.dataset.nodoxxingProcessed) {
          delete parent.dataset.nodoxxingProcessed;
        }
      }
    });
  }
}

// Hide page content immediately to prevent leakage
if (document.body) {
  document.body.classList.add('nodoxxing-processing');
}

// Initialize the redactor
let redactor;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    redactor = new NoDoxxingRedactor();
  });
} else {
  // DOM already loaded
  redactor = new NoDoxxingRedactor();
}