import { useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Brain, MessageSquare, FileText, Send, Loader2, CheckCircle2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface StoryData {
  hanzi: string;
  pinyin: string;
  error?: string;
}

interface AnalysisPanelProps {
  story: StoryData | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Question {
  id: number;
  question: string;
  answered?: boolean;
}

export const AnalysisPanel = ({ story }: AnalysisPanelProps) => {
  const [sentenceInput, setSentenceInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Questions tab state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isReviewingAnswer, setIsReviewingAnswer] = useState(false);
  const [currentReview, setCurrentReview] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [questionsCollapsed, setQuestionsCollapsed] = useState(true);

  // Open-ended questions tab state
  const [openEndedQuestions, setOpenEndedQuestions] = useState<Question[]>([]);
  const [currentOpenEndedIndex, setCurrentOpenEndedIndex] = useState(0);
  const [openEndedAnswer, setOpenEndedAnswer] = useState("");
  const [isGeneratingOpenEnded, setIsGeneratingOpenEnded] = useState(false);
  const [isReviewingOpenEnded, setIsReviewingOpenEnded] = useState(false);
  const [currentOpenEndedReview, setCurrentOpenEndedReview] = useState("");
  const [showOpenEndedReview, setShowOpenEndedReview] = useState(false);
  const [isOpenEndedCompleted, setIsOpenEndedCompleted] = useState(false);
  const [openEndedCollapsed, setOpenEndedCollapsed] = useState(true);

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversationHistory]);

  const handleAnalyze = async () => {
    if (!story || !sentenceInput.trim()) {
      toast.error("Please enter a sentence to analyze");
      return;
    }

    setIsAnalyzing(true);

    try {
      // Add user message to conversation
      const userMessage: Message = {
        role: 'user',
        content: sentenceInput
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-sentence`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            sentence: sentenceInput,
            originalStory: story.hanzi,
            hskLevel: 'HSK 1-6', // You could extract this from the story metadata
            conversationHistory: []
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to analyze sentence');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Add both user and assistant messages to history
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.analysis
      };

      setConversationHistory([userMessage, assistantMessage]);
      setSentenceInput(""); // Clear input

      toast.success("Analysis complete!");

    } catch (error) {
      console.error('Error analyzing sentence:', error);
      toast.error("Failed to analyze sentence", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFollowUp = async () => {
    if (!story || !followUpQuestion.trim() || conversationHistory.length === 0) {
      toast.error("Please enter a follow-up question");
      return;
    }

    setIsAnalyzing(true);

    try {
      // Add user question to conversation
      const userMessage: Message = {
        role: 'user',
        content: followUpQuestion
      };

      const updatedHistory = [...conversationHistory, userMessage];
      setConversationHistory(updatedHistory);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-sentence`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            sentence: followUpQuestion,
            originalStory: story.hanzi,
            hskLevel: 'HSK 1-6',
            conversationHistory: conversationHistory
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.analysis
      };

      setConversationHistory([...updatedHistory, assistantMessage]);
      setFollowUpQuestion(""); // Clear input

    } catch (error) {
      console.error('Error getting follow-up response:', error);
      toast.error("Failed to get response", {
        description: error instanceof Error ? error.message : "Please try again",
      });
      // Remove the user message we added if request failed
      setConversationHistory(conversationHistory);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClearConversation = () => {
    setConversationHistory([]);
    toast.success("Conversation cleared");
  };

  // Questions functions
  const handleGenerateQuestions = async () => {
    if (!story) {
      toast.error("No story available");
      return;
    }

    setIsGeneratingQuestions(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/comprehension-questions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: 'generate',
            story: story.hanzi,
            hskLevel: 'HSK 1-6',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setQuestions(data.questions.map((q: Question) => ({ ...q, answered: false })));
      setCurrentQuestionIndex(0);
      setShowReview(false);
      setCurrentReview("");
      setAnswer("");
      setIsCompleted(false);

      toast.success("Questions generated successfully!");
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error("Failed to generate questions", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!story || !answer.trim()) {
      toast.error("Please enter an answer");
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    setIsReviewingAnswer(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/comprehension-questions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: 'review',
            story: story.hanzi,
            question: currentQuestion.question,
            answer: answer,
            hskLevel: 'HSK 1-6',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to review answer');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setCurrentReview(data.review);
      setShowReview(true);

      // Mark question as answered
      const updatedQuestions = [...questions];
      updatedQuestions[currentQuestionIndex].answered = true;
      setQuestions(updatedQuestions);

      toast.success("Answer reviewed!");
    } catch (error) {
      console.error('Error reviewing answer:', error);
      toast.error("Failed to review answer", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsReviewingAnswer(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setAnswer("");
      setShowReview(false);
      setCurrentReview("");
    } else {
      // All questions answered
      setIsCompleted(true);
    }
  };

  const handleRestartQuestions = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswer("");
    setShowReview(false);
    setCurrentReview("");
    setIsCompleted(false);
  };

  // Open-ended questions functions
  const handleGenerateOpenEnded = async () => {
    if (!story) {
      toast.error("No story available");
      return;
    }

    setIsGeneratingOpenEnded(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/comprehension-questions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: 'generate-open-ended',
            story: story.hanzi,
            hskLevel: 'HSK 1-6',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate open-ended questions');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setOpenEndedQuestions(data.questions.map((q: Question) => ({ ...q, answered: false })));
      setCurrentOpenEndedIndex(0);
      setShowOpenEndedReview(false);
      setCurrentOpenEndedReview("");
      setOpenEndedAnswer("");
      setIsOpenEndedCompleted(false);

      toast.success("Open-ended questions generated successfully!");
    } catch (error) {
      console.error('Error generating open-ended questions:', error);
      toast.error("Failed to generate questions", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsGeneratingOpenEnded(false);
    }
  };

  const handleSubmitOpenEndedAnswer = async () => {
    if (!story || !openEndedAnswer.trim()) {
      toast.error("Please enter an answer");
      return;
    }

    const currentQuestion = openEndedQuestions[currentOpenEndedIndex];
    setIsReviewingOpenEnded(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/comprehension-questions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: 'review-open-ended',
            story: story.hanzi,
            question: currentQuestion.question,
            answer: openEndedAnswer,
            hskLevel: 'HSK 1-6',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to review answer');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setCurrentOpenEndedReview(data.review);
      setShowOpenEndedReview(true);

      // Mark question as answered
      const updatedQuestions = [...openEndedQuestions];
      updatedQuestions[currentOpenEndedIndex].answered = true;
      setOpenEndedQuestions(updatedQuestions);

      toast.success("Answer reviewed!");
    } catch (error) {
      console.error('Error reviewing answer:', error);
      toast.error("Failed to review answer", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsReviewingOpenEnded(false);
    }
  };

  const handleNextOpenEndedQuestion = () => {
    if (currentOpenEndedIndex < openEndedQuestions.length - 1) {
      setCurrentOpenEndedIndex(currentOpenEndedIndex + 1);
      setOpenEndedAnswer("");
      setShowOpenEndedReview(false);
      setCurrentOpenEndedReview("");
    } else {
      // All questions answered
      setIsOpenEndedCompleted(true);
    }
  };

  const handleRestartOpenEnded = () => {
    setOpenEndedQuestions([]);
    setCurrentOpenEndedIndex(0);
    setOpenEndedAnswer("");
    setShowOpenEndedReview(false);
    setCurrentOpenEndedReview("");
    setIsOpenEndedCompleted(false);
  };

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border border-border shadow-soft overflow-hidden">
      <Tabs defaultValue="analysis" className="flex flex-col h-full">
        <div className="bg-gradient-to-r from-accent/10 to-primary/10 px-6 py-4 border-b border-border">
          <TabsList className="bg-background/50 backdrop-blur-sm">
            <TabsTrigger value="analysis" className="data-[state=active]:bg-background">
              <Brain className="h-4 w-4 mr-2" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="questions" className="data-[state=active]:bg-background">
              <FileText className="h-4 w-4 mr-2" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="discussion" className="data-[state=active]:bg-background">
              <MessageSquare className="h-4 w-4 mr-2" />
              Open-Ended Questions
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="analysis" className="flex-1 flex flex-col m-0 overflow-hidden data-[state=inactive]:hidden">
          {!story ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <p className="text-muted-foreground text-center">
                Generate a story first to start analyzing sentences
              </p>
            </div>
          ) : (
            <>
              {/* Initial Analysis Input - Only show if no conversation */}
              {conversationHistory.length === 0 && (
                <div className="p-6 border-b border-border space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sentence-input" className="text-base">
                      Paste a sentence you don't understand:
                    </Label>
                    <Textarea
                      id="sentence-input"
                      placeholder="e.g., 我喜欢去公园。"
                      className="min-h-[100px]"
                      value={sentenceInput}
                      onChange={(e) => setSentenceInput(e.target.value)}
                      disabled={isAnalyzing}
                    />
                  </div>
                  <Button
                    className="w-full sm:w-auto"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !sentenceInput.trim()}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Analyze Sentence
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Conversation Display */}
              {conversationHistory.length > 0 && (
                <>
                  <ScrollArea className="flex-1 p-6">
                    <div className="space-y-4">
                      {conversationHistory.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <Card className={`max-w-[85%] ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}>
                            <CardContent className="p-4">
                              {message.role === 'user' ? (
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              ) : (
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {message.content}
                                  </ReactMarkdown>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                      <div ref={scrollRef} />
                    </div>
                  </ScrollArea>

                  {/* Follow-up Question Input */}
                  <div className="p-4 border-t border-border bg-background">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Ask a follow-up question..."
                        className="flex-1 min-h-[60px] resize-none"
                        value={followUpQuestion}
                        onChange={(e) => setFollowUpQuestion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleFollowUp();
                          }
                        }}
                        disabled={isAnalyzing}
                      />
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={handleFollowUp}
                          disabled={isAnalyzing || !followUpQuestion.trim()}
                          size="icon"
                        >
                          {isAnalyzing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          onClick={handleClearConversation}
                          disabled={isAnalyzing}
                          variant="outline"
                          size="sm"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Press Enter to send, Shift+Enter for new line
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="questions" className="flex-1 flex flex-col m-0 overflow-hidden data-[state=inactive]:hidden">
          {!story ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <p className="text-muted-foreground text-center">
                Generate a story first to start answering comprehension questions
              </p>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center space-y-4 max-w-md">
                <FileText className="h-12 w-12 mx-auto text-primary" />
                <h3 className="text-lg font-semibold">Reading Comprehension Practice</h3>
                <p className="text-muted-foreground">
                  Generate 5 questions about the story. You'll answer each question in Chinese,
                  and receive feedback on correctness and grammar.
                </p>
                <Button
                  onClick={handleGenerateQuestions}
                  disabled={isGeneratingQuestions}
                  size="lg"
                >
                  {isGeneratingQuestions ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate 5 Questions
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : isCompleted ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center space-y-6 max-w-md">
                <div className="space-y-2">
                  <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
                  <h3 className="text-2xl font-bold">Great Job!</h3>
                  <p className="text-muted-foreground">
                    You've answered all 5 questions. Review your answers or practice with new questions.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleGenerateQuestions}
                    disabled={isGeneratingQuestions}
                    size="lg"
                  >
                    {isGeneratingQuestions ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Generate 5 New Questions
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleRestartQuestions}
                    variant="outline"
                    size="lg"
                  >
                    Return to Start
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Questions Overview - Collapsible */}
              <div className="border-b border-border bg-muted/30 shrink-0">
                <button
                  onClick={() => setQuestionsCollapsed(!questionsCollapsed)}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <h3 className="font-semibold text-sm">All Questions ({currentQuestionIndex + 1}/5)</h3>
                  {questionsCollapsed ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {!questionsCollapsed && (
                  <div className="px-4 pb-4 space-y-1.5">
                    {questions.map((q, index) => (
                      <div
                        key={q.id}
                        className={`p-2 rounded-lg border text-xs ${
                          index === currentQuestionIndex
                            ? 'border-primary bg-primary/5 font-medium'
                            : q.answered
                            ? 'border-green-500/30 bg-green-500/5 text-muted-foreground'
                            : 'border-border bg-background/50 text-muted-foreground'
                        }`}
                      >
                        <span className="font-medium">{index + 1}.</span> {q.question}
                        {q.answered && <CheckCircle2 className="inline-block ml-2 h-3 w-3 text-green-500" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Question and Answer */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Current Question Display */}
                  <Card className="border-primary">
                    <CardContent className="p-4">
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Question {currentQuestionIndex + 1}
                      </Label>
                      <p className="text-lg font-medium text-primary">
                        {questions[currentQuestionIndex].question}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Answer Input */}
                  {!showReview && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="answer-input" className="text-sm">
                          Your Answer (in Chinese):
                        </Label>
                        <Textarea
                          id="answer-input"
                          placeholder="请用中文回答..."
                          className="min-h-[100px]"
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          disabled={isReviewingAnswer}
                        />
                      </div>
                      <Button
                        onClick={handleSubmitAnswer}
                        disabled={isReviewingAnswer || !answer.trim()}
                        className="w-full"
                      >
                        {isReviewingAnswer ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Reviewing...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit Answer
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Review Display */}
                  {showReview && (
                    <div className="space-y-3">
                      <Card className="bg-accent/5 border-accent">
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-2 text-sm">Your Answer:</h4>
                          <p className="text-base mb-3 p-2 bg-background rounded border">
                            {answer}
                          </p>
                          <h4 className="font-semibold mb-2 text-sm">Review:</h4>
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {currentReview}
                            </ReactMarkdown>
                          </div>
                        </CardContent>
                      </Card>
                      <Button
                        onClick={handleNextQuestion}
                        className="w-full"
                      >
                        {currentQuestionIndex < questions.length - 1 ? (
                          <>
                            Next Question
                            <Send className="ml-2 h-4 w-4" />
                          </>
                        ) : (
                          <>
                            Complete
                            <CheckCircle2 className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </TabsContent>

        <TabsContent value="discussion" className="flex-1 flex flex-col m-0 overflow-hidden data-[state=inactive]:hidden">
          {!story ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <p className="text-muted-foreground text-center">
                Generate a story first to start answering open-ended questions
              </p>
            </div>
          ) : openEndedQuestions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center space-y-4 max-w-md">
                <MessageSquare className="h-12 w-12 mx-auto text-primary" />
                <h3 className="text-lg font-semibold">Open-Ended Discussion</h3>
                <p className="text-muted-foreground">
                  Generate 3 open-ended questions about the story. Express your thoughts and opinions in Chinese,
                  and receive feedback on your creativity, grammar, and expression.
                </p>
                <Button
                  onClick={handleGenerateOpenEnded}
                  disabled={isGeneratingOpenEnded}
                  size="lg"
                >
                  {isGeneratingOpenEnded ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Generate 3 Questions
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : isOpenEndedCompleted ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center space-y-6 max-w-md">
                <div className="space-y-2">
                  <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
                  <h3 className="text-2xl font-bold">Excellent Work!</h3>
                  <p className="text-muted-foreground">
                    You've answered all 3 open-ended questions. Great job expressing yourself in Chinese!
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleGenerateOpenEnded}
                    disabled={isGeneratingOpenEnded}
                    size="lg"
                  >
                    {isGeneratingOpenEnded ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Generate 3 New Questions
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleRestartOpenEnded}
                    variant="outline"
                    size="lg"
                  >
                    Return to Start
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Questions Overview - Collapsible */}
              <div className="border-b border-border bg-muted/30 shrink-0">
                <button
                  onClick={() => setOpenEndedCollapsed(!openEndedCollapsed)}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <h3 className="font-semibold text-sm">All Questions ({currentOpenEndedIndex + 1}/3)</h3>
                  {openEndedCollapsed ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {!openEndedCollapsed && (
                  <div className="px-4 pb-4 space-y-1.5">
                    {openEndedQuestions.map((q, index) => (
                      <div
                        key={q.id}
                        className={`p-2 rounded-lg border text-xs ${
                          index === currentOpenEndedIndex
                            ? 'border-primary bg-primary/5 font-medium'
                            : q.answered
                            ? 'border-green-500/30 bg-green-500/5 text-muted-foreground'
                            : 'border-border bg-background/50 text-muted-foreground'
                        }`}
                      >
                        <span className="font-medium">{index + 1}.</span> {q.question}
                        {q.answered && <CheckCircle2 className="inline-block ml-2 h-3 w-3 text-green-500" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Question and Answer */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Current Question Display */}
                  <Card className="border-primary">
                    <CardContent className="p-4">
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Question {currentOpenEndedIndex + 1}
                      </Label>
                      <p className="text-lg font-medium text-primary">
                        {openEndedQuestions[currentOpenEndedIndex].question}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Answer Input */}
                  {!showOpenEndedReview && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="openended-answer-input" className="text-sm">
                          Your Answer (in Chinese):
                        </Label>
                        <Textarea
                          id="openended-answer-input"
                          placeholder="请用中文回答..."
                          className="min-h-[120px]"
                          value={openEndedAnswer}
                          onChange={(e) => setOpenEndedAnswer(e.target.value)}
                          disabled={isReviewingOpenEnded}
                        />
                      </div>
                      <Button
                        onClick={handleSubmitOpenEndedAnswer}
                        disabled={isReviewingOpenEnded || !openEndedAnswer.trim()}
                        className="w-full"
                      >
                        {isReviewingOpenEnded ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Reviewing...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit Answer
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Review Display */}
                  {showOpenEndedReview && (
                    <div className="space-y-3">
                      <Card className="bg-accent/5 border-accent">
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-2 text-sm">Your Answer:</h4>
                          <p className="text-base mb-3 p-2 bg-background rounded border">
                            {openEndedAnswer}
                          </p>
                          <h4 className="font-semibold mb-2 text-sm">Review:</h4>
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {currentOpenEndedReview}
                            </ReactMarkdown>
                          </div>
                        </CardContent>
                      </Card>
                      <Button
                        onClick={handleNextOpenEndedQuestion}
                        className="w-full"
                      >
                        {currentOpenEndedIndex < openEndedQuestions.length - 1 ? (
                          <>
                            Next Question
                            <Send className="ml-2 h-4 w-4" />
                          </>
                        ) : (
                          <>
                            Complete
                            <CheckCircle2 className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
