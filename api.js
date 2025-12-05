// ChatGPT Memory Extractor - API Module v1.0
// Unified interface for Anthropic, OpenAI, and Google APIs

export class APIClient {
  constructor(keys) {
    this.keys = keys;
  }

  // ========== ANTHROPIC (Claude) ==========
  async callAnthropic(prompt, options = {}) {
    const model = options.model || 'claude-3-5-haiku-20241022';
    const maxTokens = options.maxTokens || 1024;

    console.log(`[API] Calling Anthropic with model: ${model}`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.keys.anthropic,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`[API] Anthropic error:`, error);
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log(`[API] Anthropic response received`);
    return data.content[0].text;
  }

  // ========== OPENAI (GPT) ==========
  async callOpenAI(prompt, options = {}) {
    const model = options.model || 'gpt-4o-mini';
    const maxTokens = options.maxTokens || 1024;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.keys.openai}`
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // ========== GOOGLE (Gemini) ==========
  async callGoogle(prompt, options = {}) {
    const model = options.model || 'gemini-1.5-flash';
    const maxTokens = options.maxTokens || 1024;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.keys.google}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  // ========== UNIFIED CALL ==========
  async call(prompt, options = {}) {
    const provider = options.provider || this.getDefaultProvider();

    switch (provider) {
      case 'anthropic':
        return this.callAnthropic(prompt, options);
      case 'openai':
        return this.callOpenAI(prompt, options);
      case 'google':
        return this.callGoogle(prompt, options);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  // ========== BATCH CALLS ==========
  async batchCall(prompts, options = {}) {
    const concurrency = options.concurrency || 5;
    const results = [];

    for (let i = 0; i < prompts.length; i += concurrency) {
      const batch = prompts.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(prompt => this.call(prompt, options).catch(e => ({ error: e.message })))
      );
      results.push(...batchResults);

      // Progress callback
      if (options.onProgress) {
        options.onProgress(results.length, prompts.length);
      }

      // Rate limiting delay
      if (i + concurrency < prompts.length) {
        await this.delay(options.delay || 200);
      }
    }

    return results;
  }

  // ========== HELPERS ==========
  getDefaultProvider() {
    if (this.keys.anthropic) return 'anthropic';
    if (this.keys.openai) return 'openai';
    if (this.keys.google) return 'google';
    throw new Error('No API keys configured');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ========== MODEL MAPPING ==========
  static getModels() {
    return {
      anthropic: {
        haiku: 'claude-3-5-haiku-20241022',      // Fast, cheap - stable
        sonnet: 'claude-sonnet-4-5-20250929',    // Mid-tier - Claude 4.5
        opus: 'claude-opus-4-5-20251101'         // Best - Claude Opus 4.5
      },
      openai: {
        mini: 'gpt-4o-mini',                     // Fast, cheap
        standard: 'gpt-4o',                      // Mid-tier
        thinking: 'o1-preview'                   // Best reasoning
      },
      google: {
        flash: 'gemini-1.5-flash',               // Fast, cheap
        pro: 'gemini-1.5-pro',                   // Mid-tier
        deepthink: 'gemini-1.5-pro'              // Best (same as pro for now)
      }
    };
  }

  static getModelForTask(task, provider = 'anthropic') {
    const models = this.getModels()[provider];

    switch (task) {
      case 'labeler':
        // Fast, cheap model for labeling
        return provider === 'anthropic' ? models.haiku :
               provider === 'openai' ? models.mini :
               models.flash;

      case 'profiler':
      case 'detective':
        // Smart model for complex analysis
        return provider === 'anthropic' ? models.opus :
               provider === 'openai' ? models.standard :
               models.pro;

      default:
        return models.haiku || models.mini || models.flash;
    }
  }
}
