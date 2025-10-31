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

    // Construct the prompt
    const topicText = topic ? `about "${topic}"` : "about any random topic you can think of";
    const prompt = `You are a Chinese language teacher. Generate a short story in Chinese suitable for ${hskLevel} students ${topicText}.

Requirements:
1. Use vocabulary and grammar appropriate for ${hskLevel}
2. The story must be at least 200 characters long.
3. Make it engaging and educational
4. CRITICAL: Return your response as ONE SINGLE JSON object with exactly two fields:
   - "hanzi": The ENTIRE story (all paragraphs combined) in Chinese characters, with paragraphs separated by double newlines (\n\n)
   - "pinyin": The ENTIRE story (all paragraphs combined) in pinyin with tone marks, with paragraphs separated by double newlines (\n\n)

5. IMPORTANT:
   - Return ONLY ONE JSON object, NOT multiple JSON objects
   - Put ALL paragraphs inside the "hanzi" field, separated by \n\n
   - Put ALL paragraphs inside the "pinyin" field, separated by \n\n
   - Do NOT return an array of objects
   - Do NOT return separate JSON objects for each paragraph

Example format (notice ALL paragraphs are in ONE object):
{
  "hanzi": "李明是一个学生。他每天早上七点起床。\n\n他喜欢吃早饭。今天他吃了面包和牛奶。\n\n吃完早饭，他去学校上课。他很喜欢学习中文。",
  "pinyin": "Lǐ Míng shì yīgè xuéshēng. Tā měitiān zǎoshang qī diǎn qǐchuáng.\n\nTā xǐhuan chī zǎofàn. Jīntiān tā chīle miànbāo hé niúnǎi.\n\nChī wán zǎofàn, tā qù xuéxiào shàngkè. Tā hěn xǐhuan xuéxí Zhōngwén."
}

Only return the JSON, no additional text. Remember: ONE object with ALL paragraphs inside!`;


    // Models to try in order
    const models = [
      'meta-llama/llama-4-scout:free',
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
      try {
        // Remove any markdown code blocks if present
        let cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Check if there are multiple JSON objects (separated by newlines or whitespace)
        // This handles the case where LLM returns multiple objects instead of one
        const jsonObjects = [];
        let currentPos = 0;

        while (currentPos < cleanContent.length) {
          const trimmed = cleanContent.slice(currentPos).trim();
          if (!trimmed) break;

          try {
            // Try to parse JSON from current position
            const parsed = JSON.parse(trimmed);
            jsonObjects.push(parsed);
            break; // If we successfully parsed the entire string, we're done
          } catch (e) {
            // If parsing fails, try to find individual JSON objects
            const match = trimmed.match(/^\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
            if (match) {
              const obj = JSON.parse(match[0]);
              jsonObjects.push(obj);
              currentPos += cleanContent.indexOf(match[0], currentPos) + match[0].length;
            } else {
              break;
            }
          }
        }

        // If we found multiple JSON objects, merge them
        if (jsonObjects.length > 1) {
          console.log(`Found ${jsonObjects.length} JSON objects, merging them...`);
          const mergedHanzi = jsonObjects.map(obj => obj.hanzi || '').filter(Boolean).join('\n\n');
          const mergedPinyin = jsonObjects.map(obj => obj.pinyin || '').filter(Boolean).join('\n\n');
          storyData = {
            hanzi: mergedHanzi,
            pinyin: mergedPinyin
          };
        } else if (jsonObjects.length === 1) {
          storyData = jsonObjects[0];
        } else {
          throw new Error('No valid JSON found');
        }
      } catch (parseError) {
        console.error('Failed to parse LLM response as JSON:', content);
        // Fallback: use the content as hanzi and generate basic pinyin placeholder
        storyData = {
          hanzi: content,
          pinyin: 'Pinyin generation failed. Please try again.'
        };
      }
      // If we got a response, break out of the loop
      break;
    }

    if (storyData) {
      console.log('Story generated successfully');
      return new Response(JSON.stringify(storyData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // All models failed
      const errorMsg = lastError ? `OpenRouter API error: ${lastError.status} - ${lastError.text}` : 'Unknown error';
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
