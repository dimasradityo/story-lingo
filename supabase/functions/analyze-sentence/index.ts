import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AnalysisRequest {
  sentence: string;
  originalStory: string;
  hskLevel: string;
  conversationHistory?: Message[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sentence, originalStory, hskLevel, conversationHistory = [] }: AnalysisRequest = await req.json();
    console.log('Analyzing sentence:', { sentence, hskLevel, hasHistory: conversationHistory.length > 0 });

    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    // Build the system prompt
    const systemPrompt = `You are an expert Chinese language teacher specializing in grammar analysis for ${hskLevel} students.

Context: The student is reading this story:
${originalStory}

Your task is to help the student understand Chinese sentences by:
1. Providing clear English translations
2. Breaking down grammar structures with detailed explanations
3. Highlighting word types (verb, noun, adjective, adverb, etc.) using markdown **bold** or *italic*
4. Explaining grammar points used in the sentence
5. Answering follow-up questions about grammar, word choice, and usage

Format your response in markdown for clear readability. Use:
- **Bold** for important terms and word types
- *Italic* for pinyin or emphasis
- Bullet points for breakdowns
- Code blocks for sentence structure patterns

Be conversational and encouraging. If the student asks follow-up questions, refer back to the original sentence and story context.`;

    // Build the messages array
    const messages: Message[] = [
      { role: 'user', content: systemPrompt }
    ];

    // Add conversation history if exists
    if (conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    // Add the current sentence/question
    if (conversationHistory.length === 0) {
      // First analysis request
      messages.push({
        role: 'user',
        content: `Please analyze this sentence from the story: "${sentence}"

Provide:
1. English translation
2. Grammar breakdown with word types (mark verbs, nouns, adjectives, etc.)
3. Grammar points used
4. Any cultural or contextual notes if relevant`
      });
    } else {
      // Follow-up question
      messages.push({
        role: 'user',
        content: sentence
      });
    }

    // Models to try in order
    const models = [
      'google/gemini-2.0-flash-exp:free',
      'qwen/qwen3-235b-a22b:free',
      'deepseek/deepseek-chat-v3-0324:free',
      'mistralai/mistral-small-3.2-24b-instruct:free',
    ];

    let lastError = null;
    let analysis = null;

    for (const model of models) {
      console.log(`Calling OpenRouter API with model: ${model}`);

      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://lovable.dev',
            'X-Title': 'Chinese Practice App - Analysis',
          },
          body: JSON.stringify({
            model,
            messages: messages,
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
            break;
          }
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
          lastError = { status: 'no_content', text: 'No content in response' };
          continue;
        }

        analysis = content.trim();
        console.log('Analysis generated successfully');
        break; // Success!

      } catch (error) {
        console.error('Error calling model:', model, error);
        lastError = { status: 'error', text: String(error) };
        continue;
      }
    }

    if (!analysis) {
      // All models failed
      const errorMsg = lastError
        ? `Failed to analyze sentence: ${lastError.status} - ${lastError.text}`
        : 'Unknown error';

      return new Response(
        JSON.stringify({ error: errorMsg }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ analysis }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-sentence function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
