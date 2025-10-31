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
    const topicText = topic ? `about "${topic}"` : "about daily life in China";
    const prompt = `You are a Chinese language teacher. Generate a short story in Chinese suitable for ${hskLevel} students ${topicText}.

Requirements:
1. Use vocabulary and grammar appropriate for ${hskLevel}
2. Keep the story between 100-200 characters
3. Make it engaging and educational
4. Return your response in JSON format with two fields:
   - "hanzi": The story written in Chinese characters (汉字)
   - "pinyin": The same story written in pinyin with tone marks

Example format:
{
  "hanzi": "今天天气很好。小明去公园玩。",
  "pinyin": "Jīntiān tiānqì hěn hǎo. Xiǎo míng qù gōngyuán wán."
}

Only return the JSON, no additional text.`;

    console.log('Calling OpenRouter API...');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'Chinese Practice App',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324:free',
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
      console.error('OpenRouter API error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenRouter response received');
    
    const content = data.choices[0].message.content;
    
    // Try to parse the JSON response from the LLM
    let storyData;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      storyData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', content);
      // Fallback: use the content as hanzi and generate basic pinyin placeholder
      storyData = {
        hanzi: content,
        pinyin: 'Pinyin generation failed. Please try again.'
      };
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
