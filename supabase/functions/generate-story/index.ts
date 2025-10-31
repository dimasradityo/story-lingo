import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Import pinyin conversion library
import { pinyin } from "https://esm.sh/pinyin-pro@3.3.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hskLevel, topic } = await req.json();
    console.log('Generating story for:', { hskLevel, topic });

    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    // Simplified prompt - only ask for Chinese text
    const topicText = topic ? `about "${topic}"` : "about any random topic you can think of";
    const prompt = `You are a Chinese language teacher. Generate a short story in Chinese suitable for ${hskLevel} students ${topicText}.

Requirements:
1. Use vocabulary and grammar appropriate for ${hskLevel}
2. The story must be at least 200 characters long and have 3-5 paragraphs
3. Make it engaging and educational
4. Write ONLY in Chinese characters (汉字)
5. Separate paragraphs with double newlines

IMPORTANT: Return ONLY the Chinese story text, no JSON, no explanations, no markdown, just the story.

Example output format:
李明是一个学生。他每天早上七点起床。他住在北京。

他喜欢吃早饭。今天他吃了面包和牛奶。早饭很好吃。

吃完早饭，他去学校上课。他很喜欢学习中文。`;

    // Models to try in order
    const models = [
      'meta-llama/llama-4-scout:free',
      'mistralai/mistral-small-3.2-24b-instruct:free',
      'deepseek/deepseek-chat-v3-0324:free',
    ];

    let lastError = null;
    let hanziText = null;

    for (const model of models) {
      console.log(`Calling OpenRouter API with model: ${model}`);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://lovable.dev',
          'X-Title': 'Chinese Practice App',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenRouter API error for model ${model}:`, response.status, errorText);
        lastError = { status: response.status, text: errorText };
        // If rate limit or server error, try next model
        if (response.status === 429 || response.status === 500) {
          continue;
        } else {
          // For other errors, break and return error
          break;
        }
      }

      const data = await response.json();
      console.log('OpenRouter response received');
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        lastError = { status: 'no_content', text: 'No content in response' };
        continue;
      }

      // Clean the content - remove any markdown, JSON formatting, etc.
      let cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^\{.*?"hanzi":\s*"/gm, '')
        .replace(/"\s*,?\s*"pinyin".*?\}$/gm, '')
        .trim();

      // Extract only Chinese text (filter out any English explanations)
      const chineseOnly = cleanContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => {
          // Keep lines that contain Chinese characters
          return /[\u4e00-\u9fff]/.test(line);
        })
        .join('\n');

      if (chineseOnly.length > 100) { // Ensure we got substantial content
        hanziText = chineseOnly;
        break; // Success, exit the model loop
      } else {
        console.log('Content too short or invalid, trying next model');
        lastError = { status: 'invalid_content', text: 'Story too short or invalid' };
        continue;
      }
    }

    if (!hanziText) {
      // All models failed
      const errorMsg = lastError ? `Failed to generate story: ${lastError.status} - ${lastError.text}` : 'Unknown error';
      return new Response(
        JSON.stringify({
          error: errorMsg,
          hanzi: '',
          pinyin: ''
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate pinyin from the Chinese text using pinyin-pro library
    console.log('Converting to pinyin...');
    try {
      const pinyinText = pinyin(hanziText, {
        toneType: 'symbol', // Use tone marks (ā, á, ǎ, à)
        type: 'all', // Convert everything
        separator: '', // No separator between characters
      });

      const storyData = {
        hanzi: hanziText,
        pinyin: pinyinText
      };

      console.log('Story generated successfully with pinyin conversion');
      return new Response(JSON.stringify(storyData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (pinyinError) {
      console.error('Pinyin conversion error:', pinyinError);
      // Return story with hanzi only if pinyin conversion fails
      return new Response(
        JSON.stringify({
          hanzi: hanziText,
          pinyin: 'Pinyin conversion failed',
          error: 'Pinyin conversion error'
        }),
        {
          status: 200, // Still return 200 since we have the story
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

  } catch (error) {
    console.error('Error in generate-story function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        hanzi: '',
        pinyin: ''
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
