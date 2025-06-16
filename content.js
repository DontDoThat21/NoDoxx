// NoDoxxing Content Script - Automatically redacts sensitive data

class NoDoxxingRedactor {
  constructor() {
    this.isEnabled = true;
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
    
    this.init();
  }

  init() {
    // Check if extension is enabled
    chrome.storage.sync.get(['nodoxxingEnabled'], (result) => {
      this.isEnabled = result.nodoxxingEnabled !== false; // Default to enabled
      if (this.isEnabled) {
        this.startRedaction();
      }
    });

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (changes.nodoxxingEnabled) {
        this.isEnabled = changes.nodoxxingEnabled.newValue;
        if (this.isEnabled) {
          this.startRedaction();
        } else {
          this.restoreOriginalContent();
        }
      }
    });
  }

  startRedaction() {
    // Process current content
    this.processTextNodes();
    
    // Set up observer for dynamic content
    this.setupMutationObserver();
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
      
      // Replace text node with redacted span
      textNode.parentElement.replaceChild(redactedSpan, textNode);
    } else {
      // Mark as processed even if no redactions to avoid re-processing
      textNode.parentElement.dataset.nodoxxingProcessed = 'true';
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

// Initialize the redactor when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure DOM is fully ready
    setTimeout(() => {
      new NoDoxxingRedactor();
    }, 100);
  });
} else {
  // DOM already loaded, but add small delay for dynamic content
  setTimeout(() => {
    new NoDoxxingRedactor();
  }, 100);
}