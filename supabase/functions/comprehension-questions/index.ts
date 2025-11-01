import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Question {
  id: number;
  question: string;
}

interface GenerateQuestionsRequest {
  action: 'generate';
  story: string;
  hskLevel: string;
}

interface ReviewAnswerRequest {
  action: 'review';
  story: string;
  question: string;
  answer: string;
  hskLevel: string;
}

interface GenerateOpenEndedRequest {
  action: 'generate-open-ended';
  story: string;
  hskLevel: string;
}

interface ReviewOpenEndedRequest {
  action: 'review-open-ended';
  story: string;
  question: string;
  answer: string;
  hskLevel: string;
}

type ComprehensionRequest = GenerateQuestionsRequest | ReviewAnswerRequest | GenerateOpenEndedRequest | ReviewOpenEndedRequest;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: ComprehensionRequest = await req.json();
    console.log('Comprehension request:', { action: request.action });

    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    // Models to try in order
    const models = [
      'google/gemini-2.0-flash-exp:free',
      'qwen/qwen3-235b-a22b:free',
      'deepseek/deepseek-chat-v3-0324:free',
      'mistralai/mistral-small-3.2-24b-instruct:free',
    ];

    let result = null;
    let lastError = null;

    if (request.action === 'generate') {
      // Generate 5 comprehension questions
      const systemPrompt = `You are an expert Chinese language teacher creating comprehension questions for ${request.hskLevel} students.

Story:
${request.story}

Generate exactly 5 comprehension questions about this story. The questions should:
1. Be written in Chinese (Simplified)
2. Have answers that can be found directly in the story passage
3. Test understanding of the main ideas and details
4. Be appropriate for ${request.hskLevel} level
5. Progress from easier to slightly more challenging

Return ONLY a valid JSON array with this exact format:
[
  {"id": 1, "question": "第一个问题?"},
  {"id": 2, "question": "第二个问题?"},
  {"id": 3, "question": "第三个问题?"},
  {"id": 4, "question": "第四个问题?"},
  {"id": 5, "question": "第五个问题?"}
]

Do not include any other text, explanations, or markdown code blocks. Only return the raw JSON array.`;

      for (const model of models) {
        console.log(`Calling OpenRouter API with model: ${model}`);

        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterApiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://lovable.dev',
              'X-Title': 'Chinese Practice App - Comprehension',
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'user', content: systemPrompt }
              ],
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`OpenRouter API error for model ${model}:`, response.status, errorText);
            lastError = { status: response.status, text: errorText };

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

          // Try to parse the JSON response
          try {
            // Remove markdown code blocks if present
            let jsonText = content.trim();
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

            const questions: Question[] = JSON.parse(jsonText);

            // Validate the response
            if (Array.isArray(questions) && questions.length === 5) {
              result = { questions };
              console.log('Questions generated successfully');
              break;
            } else {
              lastError = { status: 'invalid_format', text: 'Response did not contain 5 questions' };
              continue;
            }
          } catch (parseError) {
            console.error('Failed to parse JSON from model:', model, parseError);
            lastError = { status: 'parse_error', text: String(parseError) };
            continue;
          }

        } catch (error) {
          console.error('Error calling model:', model, error);
          lastError = { status: 'error', text: String(error) };
          continue;
        }
      }

    } else if (request.action === 'generate-open-ended') {
      // Generate 3 open-ended discussion questions
      const systemPrompt = `You are an expert Chinese language teacher creating open-ended discussion questions for ${request.hskLevel} students.

Story:
${request.story}

Generate exactly 3 open-ended discussion questions about this story. The questions should:
1. Be written in Chinese (Simplified)
2. Encourage creative thinking and personal expression
3. Allow for multiple valid answers and perspectives
4. Be related to the story's themes, characters, or situations
5. Be appropriate for ${request.hskLevel} level

Examples of open-ended questions:
- "如果你是故事中的人物，你会怎么做？" (What would you do if you were the character?)
- "你觉得这个故事想告诉我们什么？" (What do you think this story is trying to tell us?)
- "你有过类似的经历吗？" (Have you had a similar experience?)

Return ONLY a valid JSON array with this exact format:
[
  {"id": 1, "question": "第一个问题?"},
  {"id": 2, "question": "第二个问题?"},
  {"id": 3, "question": "第三个问题?"}
]

Do not include any other text, explanations, or markdown code blocks. Only return the raw JSON array.`;

      for (const model of models) {
        console.log(`Calling OpenRouter API with model: ${model}`);

        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterApiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://lovable.dev',
              'X-Title': 'Chinese Practice App - Open-Ended',
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'user', content: systemPrompt }
              ],
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`OpenRouter API error for model ${model}:`, response.status, errorText);
            lastError = { status: response.status, text: errorText };

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

          // Try to parse the JSON response
          try {
            // Remove markdown code blocks if present
            let jsonText = content.trim();
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

            const questions: Question[] = JSON.parse(jsonText);

            // Validate the response
            if (Array.isArray(questions) && questions.length === 3) {
              result = { questions };
              console.log('Open-ended questions generated successfully');
              break;
            } else {
              lastError = { status: 'invalid_format', text: 'Response did not contain 3 questions' };
              continue;
            }
          } catch (parseError) {
            console.error('Failed to parse JSON from model:', model, parseError);
            lastError = { status: 'parse_error', text: String(parseError) };
            continue;
          }

        } catch (error) {
          console.error('Error calling model:', model, error);
          lastError = { status: 'error', text: String(error) };
          continue;
        }
      }

    } else if (request.action === 'review') {
      // Review the user's answer
      const systemPrompt = `You are an expert Chinese language teacher reviewing a student's answer for ${request.hskLevel} level.

Story Passage:
${request.story}

Question (in Chinese):
${request.question}

Student's Answer (in Chinese):
${request.answer}

Review the student's answer and provide feedback in English. Your review should include:

1. **Correctness**: Is the answer factually correct based on the story? Does it answer the question?
2. **Grammar**: Check for any grammar mistakes in the Chinese sentence
3. **Improvements**: Suggest how the answer could be improved (word choice, sentence structure, more natural phrasing)
4. **Encouragement**: Provide positive, encouraging feedback

Format your response in markdown for clear readability. Use:
- **Bold** for section headers and key points
- *Italic* for Chinese text and pinyin
- Bullet points for lists
- A friendly, encouraging tone

If the answer is correct and well-written, praise the student. If there are issues, explain them clearly and provide the correct version.`;

      for (const model of models) {
        console.log(`Calling OpenRouter API with model: ${model}`);

        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterApiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://lovable.dev',
              'X-Title': 'Chinese Practice App - Review',
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'user', content: systemPrompt }
              ],
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`OpenRouter API error for model ${model}:`, response.status, errorText);
            lastError = { status: response.status, text: errorText };

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

          result = { review: content.trim() };
          console.log('Review generated successfully');
          break;

        } catch (error) {
          console.error('Error calling model:', model, error);
          lastError = { status: 'error', text: String(error) };
          continue;
        }
      }
    } else if (request.action === 'review-open-ended') {
      // Review the user's open-ended answer
      const systemPrompt = `You are an expert Chinese language teacher reviewing a student's creative answer for ${request.hskLevel} level.

Story Passage:
${request.story}

Open-Ended Question (in Chinese):
${request.question}

Student's Answer (in Chinese):
${request.answer}

Review the student's open-ended answer and provide feedback in English. Your review should include:

1. **Content Evaluation**: Does the answer demonstrate understanding and creative thinking? Is it relevant to the question?
2. **Grammar Check**: Identify any grammar mistakes in the Chinese sentence
3. **Language Quality**: Comment on vocabulary usage, sentence structure, and natural expression
4. **Constructive Feedback**: Provide specific suggestions on how to improve the answer
5. **Encouragement**: Acknowledge good points and encourage continued learning

Format your response in markdown for clear readability. Use:
- **Bold** for section headers and key points
- *Italic* for Chinese text and pinyin
- Bullet points for lists
- A friendly, supportive, and encouraging tone

Since this is an open-ended question, focus on the quality of expression rather than looking for a "correct" answer. Appreciate creative and thoughtful responses while helping improve Chinese language skills.`;

      for (const model of models) {
        console.log(`Calling OpenRouter API with model: ${model}`);

        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterApiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://lovable.dev',
              'X-Title': 'Chinese Practice App - Open-Ended Review',
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'user', content: systemPrompt }
              ],
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`OpenRouter API error for model ${model}:`, response.status, errorText);
            lastError = { status: response.status, text: errorText };

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

          result = { review: content.trim() };
          console.log('Open-ended review generated successfully');
          break;

        } catch (error) {
          console.error('Error calling model:', model, error);
          lastError = { status: 'error', text: String(error) };
          continue;
        }
      }
    } else {
      throw new Error('Invalid action specified');
    }

    if (!result) {
      // All models failed
      const errorMsg = lastError
        ? `Failed to process request: ${lastError.status} - ${lastError.text}`
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
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in comprehension-questions function:', error);
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
