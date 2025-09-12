/**
 * Utility functions to handle emoji encoding/decoding issues
 * AWS SES sometimes converts emojis to Unicode escape sequences
 */

/**
 * Decode Unicode escape sequences back to emojis
 * Handles both single escape sequences and surrogate pairs
 */
export const decodeEmojis = (text: string): string => {
  if (!text) return text;
  
  try {
    // Handle Unicode escape sequences like \uD83C\uDF89 (surrogate pairs)
    let decoded = text.replace(/\\u([0-9A-Fa-f]{4})\\u([0-9A-Fa-f]{4})/g, (match, high, low) => {
      const highSurrogate = parseInt(high, 16);
      const lowSurrogate = parseInt(low, 16);
      
      // Check if this is a valid surrogate pair
      if (highSurrogate >= 0xD800 && highSurrogate <= 0xDBFF && 
          lowSurrogate >= 0xDC00 && lowSurrogate <= 0xDFFF) {
        return String.fromCharCode(highSurrogate, lowSurrogate);
      }
      
      // If not a valid surrogate pair, treat as separate characters
      return String.fromCharCode(highSurrogate) + String.fromCharCode(lowSurrogate);
    });
    
    // Handle single Unicode escape sequences like \u0041
    decoded = decoded.replace(/\\u([0-9A-Fa-f]{4})/g, (match, grp) => {
      return String.fromCharCode(parseInt(grp, 16));
    });
    
    // Handle hex escape sequences like \x41
    decoded = decoded.replace(/\\x([0-9A-Fa-f]{2})/g, (match, grp) => {
      return String.fromCharCode(parseInt(grp, 16));
    });
    
    return decoded;
  } catch (error) {
    console.warn('Error decoding emojis:', error);
    return text;
  }
};

/**
 * Ensure emojis are properly encoded for AWS SES
 */
export const encodeForSES = (text: string): string => {
  if (!text) return text;
  
  // AWS SES handles UTF-8 well, so we just ensure proper encoding
  // Convert any escaped sequences back to proper UTF-8
  return decodeEmojis(text);
};

/**
 * Clean and fix emoji encoding in template data
 */
export const fixTemplateEmojis = (template: any) => {
  if (!template) return template;
  
  return {
    ...template,
    TemplateName: decodeEmojis(template.TemplateName || ''),
    SubjectPart: decodeEmojis(template.SubjectPart || ''),
    HtmlPart: decodeEmojis(template.HtmlPart || ''),
    TextPart: decodeEmojis(template.TextPart || ''),
  };
};
