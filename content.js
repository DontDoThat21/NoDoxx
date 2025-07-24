// Redactor Content Script - Automatically redacts sensitive data

class RedactorRedactor {
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
    
    // Blacklisted domains where extension should never operate
    this.blacklistedDomains = [
      'chat.openai.com',
      'claude.ai',
      'irs.gov',
      'ssa.gov',
      'usa.gov'
    ];
    
    this.init();
  }

  init() {
    // Check if extension is enabled and load user strings, contrast mode setting, and site list
    // Check if current domain is blacklisted
    if (this.isBlacklistedDomain()) {
      console.log('NoDoxx: Extension disabled on blacklisted domain:', window.location.hostname);
      this.revealPage();
      return;
    }

    // Check if extension is enabled and load user strings and contrast mode setting
    try {
      chrome.storage.sync.get(['nodoxxingEnabled', 'userStrings', 'contrastModeEnabled', 'siteList', 'siteListMode'], (result) => {
        try {
          this.isEnabled = result.nodoxxingEnabled !== false; // Default to enabled
          this.contrastModeEnabled = result.contrastModeEnabled !== false; // Default to enabled
          this.userStrings = result.userStrings || []; // Default to empty array
          this.siteList = result.siteList || [];
          this.siteListMode = result.siteListMode || 'disabled';
          
          this.updateUserPatterns();
          
          // Check if current site should be protected based on site list settings
          const shouldProtect = this.shouldProtectCurrentSite();
          
          if (this.isEnabled && shouldProtect) {
            this.startRedaction();
          } else {
            // If disabled, remove processing class immediately
            this.revealPage();
          }
        } catch (error) {
          console.error('NoDoxx: Error in storage callback:', error);
          // Fallback: reveal page to prevent permanent hiding
          this.revealPage();
        }
      });
    } catch (error) {
      console.error('NoDoxx: Error accessing chrome.storage:', error);
      // Fallback: reveal page to prevent permanent hiding
      this.revealPage();
    }

    // Add additional safety mechanism - check DOM readiness
    this.ensureDOMReady(() => {
      // If we reach here and page is still hidden, force reveal
      if (!this.isPageVisible()) {
        console.warn('NoDoxx: Page still hidden after DOM ready, forcing reveal');
        this.revealPage();
      }
    });

    // Listen for storage changes
    try {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (changes.nodoxxingEnabled) {
          this.isEnabled = changes.nodoxxingEnabled.newValue;
          if (this.isEnabled && this.shouldProtectCurrentSite()) {
            // Hide page again for re-processing
            this.hidePage();
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
          // Re-process content if extension is enabled and should protect this site
          if (this.isEnabled && this.shouldProtectCurrentSite()) {
            // Hide page again for re-processing
            this.hidePage();
            this.restoreOriginalContent();
            this.startRedaction();
          }
        }
        
        // Update contrast mode when it changes
        if (changes.contrastModeEnabled) {
          this.contrastModeEnabled = changes.contrastModeEnabled.newValue;
          // Re-process content if extension is enabled and should protect this site
          if (this.isEnabled && this.shouldProtectCurrentSite()) {
            this.hidePage();
            this.restoreOriginalContent();
            this.startRedaction();
          }
        }
        
        // Update site list when it changes
        if (changes.siteList) {
          this.siteList = changes.siteList.newValue || [];
          this.reprocessBasedOnSiteList();
        }
        
        // Update site list mode when it changes
        if (changes.siteListMode) {
          this.siteListMode = changes.siteListMode.newValue;
          this.reprocessBasedOnSiteList();
        }
      });
    } catch (error) {
      console.error('NoDoxx: Error setting up storage listener:', error);
    }
  }

  isBlacklistedDomain() {
    try {
      const currentHostname = window.location.hostname.toLowerCase();
      return this.blacklistedDomains.some(domain => 
        currentHostname === domain || currentHostname.endsWith('.' + domain)
      );
    } catch (error) {
      console.error('NoDoxx: Error checking blacklisted domains:', error);
      return false;
    }
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
  
  getCurrentDomain() {
    try {
      return window.location.hostname;
    } catch (error) {
      console.error('NoDoxx: Error getting current domain:', error);
      return '';
    }
  }
  
  normalizeDomain(domain) {
    // Remove common subdomains like 'www.'
    return domain.replace(/^www\./, '');
  }
  
  shouldProtectCurrentSite() {
    if (this.siteListMode === 'disabled') {
      return true; // Protect all sites when site list is disabled
    }
    
    const currentDomain = this.getCurrentDomain();
    const normalizedCurrentDomain = this.normalizeDomain(currentDomain);
    const siteInList = this.siteList.find(site => this.normalizeDomain(site.url) === normalizedCurrentDomain && site.enabled);
    
    if (this.siteListMode === 'whitelist') {
      // Only protect sites that are in the list and enabled
      return !!siteInList;
    } else if (this.siteListMode === 'blacklist') {
      // Don't protect sites that are in the list and enabled
      return !siteInList;
    }
    
    return true; // Default to protecting
  }
  
  reprocessBasedOnSiteList() {
    const shouldProtect = this.shouldProtectCurrentSite();
    
    if (this.isEnabled && shouldProtect) {
      // Should protect - start redaction if not already running
      this.hidePage();
      this.restoreOriginalContent();
      this.startRedaction();
    } else {
      // Should not protect - stop redaction
      this.restoreOriginalContent();
      this.revealPage();
    }
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

  ensureDOMReady(callback) {
    // Ensure DOM elements are available before proceeding
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      // DOM is already ready
      callback();
    } else {
      // Wait for DOMContentLoaded event
      document.addEventListener('DOMContentLoaded', () => {
        callback();
      });
    }
  }

  isPageVisible() {
    // Check if page is currently visible to user
    try {
      const body = document.body;
      const html = document.documentElement;
      
      if (!body || !html) return false;
      
      // Check class-based visibility
      const hasReadyClass = html.classList.contains('redactor-ready');
      const hasProcessingClass = body.classList.contains('redactor-processing');
      
      // Check style-based visibility
      const bodyStyle = window.getComputedStyle(body);
      const htmlStyle = window.getComputedStyle(html);
      
      const bodyVisible = bodyStyle.visibility !== 'hidden' && bodyStyle.opacity !== '0';
      const htmlVisible = htmlStyle.visibility !== 'hidden' && htmlStyle.opacity !== '0';
      
      return hasReadyClass && !hasProcessingClass && bodyVisible && htmlVisible;
    } catch (error) {
      console.error('NoDoxx: Error checking page visibility:', error);
      return false;
    }
  }

  hidePage() {
    // Remove ready class and add processing class to hide the page
    try {
      if (document.documentElement) {
        document.documentElement.classList.remove('redactor-ready');
        document.documentElement.style.visibility = 'hidden';
        document.documentElement.style.opacity = '0';
      }
      if (document.body) {
        document.body.classList.add('redactor-processing');
        document.body.style.visibility = 'hidden';
        document.body.style.opacity = '0';
      }
    } catch (error) {
      console.error('NoDoxx: Error in hidePage:', error);
    }
  }

  revealPage() {
    // Remove the processing class and add ready class to show the page
    try {
      if (document.body) {
        document.body.classList.remove('redactor-processing');
        document.body.style.visibility = 'visible';
        document.body.style.opacity = '1';
      }
      if (document.documentElement) {
        document.documentElement.classList.add('redactor-ready');
        document.documentElement.style.visibility = 'visible';
        document.documentElement.style.opacity = '1';
      }
      
      // Clear safety timeout since page is now properly revealed
      if (typeof safetyTimeout !== 'undefined') {
        clearTimeout(safetyTimeout);
      }
    } catch (error) {
      console.error('NoDoxx: Error in revealPage:', error);
      // Last resort - use force reveal
      forceRevealPage();
    }
  }

  processTextNodes() {
    this.processElementTextNodes(document.body);
  }

  isWithinHeading(textNode) {
    // Check if text node is within a heading element (h1-h6)
    let currentElement = textNode.parentElement;
    while (currentElement && currentElement !== document.body) {
      if (/^H[1-6]$/i.test(currentElement.tagName)) {
        return true;
      }
      currentElement = currentElement.parentElement;
    }
    return false;
  }

  processTextNode(textNode) {
    // Skip if already processed or if parent is redacted
    if (!textNode || !textNode.parentElement || 
        textNode.parentElement.classList.contains('redactor-redacted') ||
        textNode.parentElement.dataset.redactorProcessed) {
      return;
    }

    let content = textNode.textContent;
    let hasRedactions = false;
    let originalContent = content;
    const isInHeading = this.isWithinHeading(textNode);

    // Apply all redaction patterns, but skip sensitive keyword patterns in headings
    for (const [patternName, pattern] of Object.entries(this.patterns)) {
      // Skip name pattern in headings as it might redact legitimate title words
      if (isInHeading && patternName === 'names') {
        continue;
      }
      
      if (pattern.test(content)) {
        hasRedactions = true;
        content = content.replace(pattern, (match) => {
          return `REDACTED`;
        });
      }
    }

    // Apply user-defined string redactions (but be less aggressive in headings)
    if (this.userPatterns.length > 0 && !isInHeading) {
      for (const userPattern of this.userPatterns) {
        if (userPattern.test(content)) {
          hasRedactions = true;
          content = content.replace(userPattern, 'REDACTED');
        }
      }
    }

    // Skip sensitive context checking in headings to prevent redacting words like "login", "password" in titles
    if (!isInHeading && this.hasSensitiveContext(originalContent)) {
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
      textNode.parentElement.dataset.redactorProcessed = 'true';
      
      // Create redacted span element
      const redactedSpan = document.createElement('span');
      redactedSpan.className = 'redactor-redacted';
      redactedSpan.textContent = content;
      redactedSpan.title = 'Sensitive data redacted by Redactor extension';
      
      // Apply contrast-aware styling
      const parentBgColor = this.getElementBackgroundColor(textNode.parentElement);
      const contrastColors = this.getContrastColors(parentBgColor);
      
      // Apply the contrast colors directly to the element
      redactedSpan.style.backgroundColor = contrastColors.backgroundColor;
      redactedSpan.style.color = contrastColors.color;
      redactedSpan.style.borderColor = contrastColors.borderColor;
      
      // Also set a custom hover color that's slightly different
      const hoverColor = this.getHoverColor(contrastColors.backgroundColor);
      redactedSpan.addEventListener('mouseenter', () => {
        redactedSpan.style.backgroundColor = hoverColor;
      });
      redactedSpan.addEventListener('mouseleave', () => {
        redactedSpan.style.backgroundColor = contrastColors.backgroundColor;
      });
      
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
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loops
    
    while (currentElement && currentElement !== document.body && attempts < maxAttempts) {
      try {
        const computedStyle = window.getComputedStyle(currentElement);
        const backgroundColor = computedStyle.backgroundColor;
        
        // If we find a non-transparent background color, use it
        if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
          return backgroundColor;
        }
      } catch (error) {
        // If getComputedStyle fails, continue to parent
        console.debug('Redactor: Failed to get computed style for element', error);
      }
      
      currentElement = currentElement.parentElement;
      attempts++;
    }
    
    // Default to body background color or white
    try {
      const bodyStyle = window.getComputedStyle(document.body);
      const bodyBg = bodyStyle.backgroundColor;
      return (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)' && bodyBg !== 'transparent') ? bodyBg : 'rgb(255, 255, 255)';
    } catch (error) {
      // If all else fails, return white
      console.debug('Redactor: Failed to get body background color', error);
      return 'rgb(255, 255, 255)';
    }
  }

  parseRgbColor(colorString) {
    // Parse various color formats to RGB values
    if (!colorString || typeof colorString !== 'string') {
      return [255, 255, 255]; // Default to white
    }
    
    const color = colorString.trim();
    
    if (color.startsWith('rgb(')) {
      const values = color.match(/\d+/g);
      return values ? values.map(Number) : [255, 255, 255];
    } else if (color.startsWith('rgba(')) {
      const values = color.match(/[\d.]+/g);
      return values ? values.slice(0, 3).map(Number) : [255, 255, 255];
    } else if (color.startsWith('#')) {
      const hex = color.slice(1);
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
    } else if (color === 'transparent' || color === 'inherit') {
      return [255, 255, 255]; // Default to white for transparent
    }
    
    // Try to handle named colors (basic ones)
    const namedColors = {
      'white': [255, 255, 255],
      'black': [0, 0, 0],
      'red': [255, 0, 0],
      'green': [0, 128, 0],
      'blue': [0, 0, 255],
      'yellow': [255, 255, 0],
      'cyan': [0, 255, 255],
      'magenta': [255, 0, 255],
      'gray': [128, 128, 128],
      'grey': [128, 128, 128]
    };
    
    const lowerColor = color.toLowerCase();
    if (namedColors[lowerColor]) {
      return namedColors[lowerColor];
    }
    
    // Default to white if parsing fails
    return [255, 255, 255];
  }

  calculateLuminance(r, g, b) {
    // Calculate relative luminance using sRGB color space
    // Ensure values are within valid range
    r = Math.max(0, Math.min(255, r || 0));
    g = Math.max(0, Math.min(255, g || 0));
    b = Math.max(0, Math.min(255, b || 0));
    
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

  getHoverColor(backgroundColor) {
    // Generate a slightly different color for hover state
    const [r, g, b] = this.parseRgbColor(backgroundColor);
    
    // Determine if the background is light or dark
    const luminance = this.calculateLuminance(r, g, b);
    const isLight = luminance > 0.5;
    
    if (isLight) {
      // For light backgrounds, make it slightly darker
      const newR = Math.max(0, r - 30);
      const newG = Math.max(0, g - 30);
      const newB = Math.max(0, b - 30);
      return `rgb(${newR}, ${newG}, ${newB})`;
    } else {
      // For dark backgrounds, make it slightly lighter
      const newR = Math.min(255, r + 30);
      const newG = Math.min(255, g + 30);
      const newB = Math.min(255, b + 30);
      return `rgb(${newR}, ${newG}, ${newB})`;
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
            } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('redactor-redacted')) {
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
          if (parent.classList.contains('redactor-redacted') || 
              parent.dataset.redactorProcessed) {
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
    const elementsWithOriginalContent = document.querySelectorAll('[data-original-content], [data-redactor-processed]');
    
    elementsWithOriginalContent.forEach(element => {
      // Find redacted spans within this element
      const redactedSpans = element.querySelectorAll('.redactor-redacted');
      
      if (redactedSpans.length > 0 && element.dataset.originalContent) {
        // Restore original text content
        element.textContent = element.dataset.originalContent;
        delete element.dataset.originalContent;
      }
      
      // Remove processing marker
      if (element.dataset.redactorProcessed) {
        delete element.dataset.redactorProcessed;
      }
    });
    
    // Also remove any standalone redacted elements
    const standaloneRedacted = document.querySelectorAll('.redactor-redacted');
    standaloneRedacted.forEach(span => {
      const parent = span.parentElement;
      if (parent && parent.dataset.originalContent) {
        parent.textContent = parent.dataset.originalContent;
        delete parent.dataset.originalContent;
        if (parent.dataset.redactorProcessed) {
          delete parent.dataset.redactorProcessed;
        }
      }
    });
  }
}

// Immediately inject CSS to hide page content and prevent any leakage
function injectImmediateHidingCSS() {
  const style = document.createElement('style');
  style.textContent = `
    html, body {
      visibility: hidden !important;
      opacity: 0 !important;
    }
    html.redactor-ready, html.redactor-ready body {
      visibility: visible !important;
      opacity: 1 !important;
    }
    body.redactor-processing {
      visibility: hidden !important;
      opacity: 0 !important;
    }
  `;
  
  try {
    // Try to insert at the very beginning of head
    if (document.head) {
      document.head.insertBefore(style, document.head.firstChild);
    } else if (document.documentElement) {
      // If head doesn't exist yet, create it
      const head = document.createElement('head');
      head.appendChild(style);
      document.documentElement.insertBefore(head, document.documentElement.firstChild);
    } else {
      // Last resort - append to document when it becomes available
      const addStyle = () => {
        if (document.head) {
          document.head.appendChild(style);
        } else if (document.documentElement) {
          const head = document.createElement('head');
          head.appendChild(style);
          document.documentElement.appendChild(head);
        } else {
          // Try again in 10ms
          setTimeout(addStyle, 10);
        }
      };
      addStyle();
    }
  } catch (error) {
    console.error('NoDoxx: Error injecting hiding CSS:', error);
    // If we can't inject CSS, don't hide the page
  }
}

// Inject hiding CSS immediately
injectImmediateHidingCSS();

// Safety timeout to ensure page is never permanently hidden
// This protects against extension errors or edge cases
let safetyTimeout = setTimeout(() => {
  console.warn('NoDoxx: Safety timeout triggered, revealing page');
  forceRevealPage();
}, 1000); // 1 second maximum hiding time (reduced from 5 seconds)

// Force reveal page function with comprehensive fallback
function forceRevealPage() {
  try {
    if (document.documentElement) {
      document.documentElement.classList.add('redactor-ready');
      document.documentElement.style.visibility = 'visible';
      document.documentElement.style.opacity = '1';
    }
    if (document.body) {
      document.body.classList.remove('redactor-processing');
      document.body.style.visibility = 'visible';
      document.body.style.opacity = '1';
    }
  } catch (error) {
    console.error('NoDoxx: Error in forceRevealPage:', error);
  }
}

// Initialize the redactor when DOM is ready
let redactor;

function initializeRedactor() {
  try {
    // Ensure DOM elements exist before creating redactor
    if (!document.body || !document.documentElement) {
      // If DOM isn't ready, wait a bit and try again
      setTimeout(initializeRedactor, 10);
      return;
    }
    
    redactor = new RedactorRedactor();
  } catch (error) {
    console.error('NoDoxx: Error initializing redactor:', error);
    // Force reveal page if initialization fails
    forceRevealPage();
  }
}

// Try to initialize immediately, or wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeRedactor);
  // Also try with a small delay in case DOMContentLoaded already fired
  setTimeout(initializeRedactor, 50);
} else {
  // DOM already loaded
  initializeRedactor();
}