class GeminiService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    this.baseUrl = 'https://generativelanguage.googleapis.com';
  }

  async generateContent(
    messages: Array<{ role: string; content: string; imageUrl?: string }>,
    model: string = 'gemini-3-flash-preview',
    temperature: number = 0.1
  ) {
    try {
      // Transform messages for Gemini API format, handling both text and images
      const contents = messages.map(msg => {
        const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [];
        
        // Add text part
        parts.push({ text: msg.content });
        
        // If there's an image URL, add it as a separate part
        if (msg.imageUrl) {
          // Extract the base64 data from the image URL if it's a data URL
          if (msg.imageUrl.startsWith('data:image')) {
            const [header, base64Data] = msg.imageUrl.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
            
            parts.push({
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            });
          }
        }
        
        return {
          role: msg.role === 'user' ? 'user' : 'model', // Gemini uses 'user' and 'model' instead of 'user' and 'assistant'
          parts
        };
      });

      const response = await fetch(`${this.baseUrl}/v1beta/models/${model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature,
            maxOutputTokens: 1000,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error with Gemini API:', error);
      throw error;
    }
  }
}

export default GeminiService;