import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Simplified prompt - just generate the story naturally
    const topicText = topic ? `about "${topic}"` : "about any random topic you can think of";
    const prompt = `You are a Chinese language teacher. Generate a short story in Chinese suitable for ${hskLevel} students ${topicText}.

Requirements:
1. Use vocabulary and grammar appropriate for ${hskLevel}
2. The story must be at least 200 characters long and have 3-5 paragraphs
3. Make it engaging and educational

Respond with a JSON object with these two fields:
- "hanzi": the story in Chinese characters, with paragraphs separated by \\n\\n
- "pinyin": the same story in pinyin with tone marks, with paragraphs separated by \\n\\n

Just return the JSON, nothing else.`;

    // Models to try in order
    const models = [
      'google/gemini-2.0-flash-exp:free',
      'qwen/qwen3-235b-a22b:free',
      'mistralai/mistral-small-3.2-24b-instruct:free',
      'deepseek/deepseek-chat-v3-0324:free',
    ];

    let lastError = null;
    let storyData = null;

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

      // Robust parsing that handles multiple formats
      try {
        // Clean up the content
        let cleanContent = content.trim();

        // Remove markdown code blocks
        cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');

        // Try to extract all JSON objects from the response
        const jsonObjects: Array<{hanzi?: string, pinyin?: string}> = [];

        // Method 1: Try parsing the whole thing as JSON
        try {
          const parsed = JSON.parse(cleanContent);
          if (parsed.hanzi || parsed.pinyin) {
            jsonObjects.push(parsed);
          }
        } catch {
          // Method 2: Find all JSON objects in the text
          const jsonRegex = /\{[^{}]*(?:"hanzi"|"pinyin")[^{}]*(?:"hanzi"|"pinyin")[^{}]*\}/g;
          const matches = cleanContent.match(jsonRegex);

          if (matches) {
            for (const match of matches) {
              try {
                const parsed = JSON.parse(match);
                if (parsed.hanzi || parsed.pinyin) {
                  jsonObjects.push(parsed);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        console.log(`Found ${jsonObjects.length} JSON objects`);

        if (jsonObjects.length === 0) {
          throw new Error('No valid JSON found');
        }

        // Merge all objects
        const allHanzi: string[] = [];
        const allPinyin: string[] = [];

        for (const obj of jsonObjects) {
          if (obj.hanzi) {
            allHanzi.push(obj.hanzi.trim());
          }
          if (obj.pinyin) {
            allPinyin.push(obj.pinyin.trim());
          }
        }

        const mergedHanzi = allHanzi.join('\n\n');
        const mergedPinyin = allPinyin.join('\n\n');

        // Validate we got content
        if (mergedHanzi.length < 100) {
          throw new Error('Story too short');
        }

        storyData = {
          hanzi: mergedHanzi,
          pinyin: mergedPinyin || 'Pinyin not generated'
        };

        console.log('Successfully parsed story');
        break; // Success!

      } catch (parseError) {
        console.error('Parse error:', parseError);
        lastError = { status: 'parse_error', text: String(parseError) };
        continue; // Try next model
      }
    }

    if (!storyData) {
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

    console.log('Story generated successfully');
    return new Response(JSON.stringify(storyData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

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
