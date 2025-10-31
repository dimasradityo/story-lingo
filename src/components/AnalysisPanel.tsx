import { useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Brain, MessageSquare, FileText, Send, Loader2 } from "lucide-react";
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

export const AnalysisPanel = ({ story }: AnalysisPanelProps) => {
  const [sentenceInput, setSentenceInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

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
              Discussion
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="analysis" className="flex-1 flex flex-col m-0 overflow-hidden">
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

        <TabsContent value="questions" className="p-6 m-0">
          <div className="text-center text-muted-foreground">
            Questions feature coming soon...
          </div>
        </TabsContent>

        <TabsContent value="discussion" className="p-6 m-0">
          <div className="text-center text-muted-foreground">
            Discussion feature coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
