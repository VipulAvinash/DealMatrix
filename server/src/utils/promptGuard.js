/**
 * Patterns that indicate prompt injection attempts
 */
const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|prior|above|former)\s+(instructions?|prompts?|context|rules?)/i,
  /reveal\s+(api|secret|system|your)\s*(key|prompt|instructions?|token)/i,
  /system\s+prompt/i,
  /developer\s+prompt/i,
  /you\s+are\s+now\s+(a|an|my)/i,
  /pretend\s+(you|to)\s+(are|be|ignore)/i,
  /act\s+as\s+(if|though|a|an)/i,
  /jailbreak/i,
  /bypass\s+(safety|filters?|restrictions?|guidelines?)/i,
  /disregard\s+(all|any|previous|your)/i,
  /do\s+anything\s+now/i,
  /dan\s+(mode|prompt)/i,
  /\beval\s*\(/i,
  /\bexec\s*\(/i,
  /<\s*script/i,
  /javascript:/i,
];

/**
 * Checks if a query contains potential prompt injection
 * @param {string} query - User input to check
 * @returns {{ safe: boolean, reason?: string }}
 */
export const checkPromptInjection = (query) => {
  if (!query || typeof query !== "string") {
    return { safe: true };
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(query)) {
      return {
        safe: false,
        reason: "Query contains restricted patterns",
      };
    }
  }

  // Check for excessive special characters (potential encoding attacks)
  const specialCharRatio = (query.match(/[<>{}\[\]\\\/\|@#$%^&*]/g) || []).length / query.length;
  if (specialCharRatio > 0.3 && query.length > 10) {
    return {
      safe: false,
      reason: "Query contains excessive special characters",
    };
  }

  return { safe: true };
};

/**
 * Sanitizes a product search query
 * @param {string} query - Raw user query
 * @returns {string} Sanitized query
 */
export const sanitizeQuery = (query) => {
  return query
    .trim()
    .replace(/[<>{}\\]/g, "")    // Remove dangerous chars
    .replace(/\s+/g, " ")        // Normalize whitespace
    .substring(0, 200);          // Limit length
};
