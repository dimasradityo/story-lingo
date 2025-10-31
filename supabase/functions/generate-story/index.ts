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

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Construct the prompt
    const topicText = topic ? `about "${topic}"` : "about any random topic you can think of";
    const prompt = `You are a Chinese language teacher. Generate a short story in Chinese suitable for ${hskLevel} students ${topicText}.

Requirements:
1. Use vocabulary and grammar appropriate for ${hskLevel}
2. The story must be at least 4 paragraphs, with each paragraph having 4-5 sentences.
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


    console.log('Calling Lovable AI Gateway...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
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
      console.error('Lovable AI Gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: `AI Gateway error: ${response.status}`,
          hanzi: '',
          pinyin: ''
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    console.log('AI response received');
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return new Response(
        JSON.stringify({ 
          error: 'No content in response',
          hanzi: '',
          pinyin: ''
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

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
