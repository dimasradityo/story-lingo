import { useState } from "react";
import { StoryGenerator } from "@/components/StoryGenerator";
import { StoryDisplay } from "@/components/StoryDisplay";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { FloatingTabs } from "@/components/FloatingTabs";
import { MobileBottomSheet } from "@/components/MobileBottomSheet";
import { Languages } from "lucide-react";
import { toast } from "sonner";

interface StoryData {
  hanzi: string;
  pinyin: string;
  error?: string;
}

interface Question {
  id: number;
  question: string;
  answered?: boolean;
}

const Index = () => {
  const [story, setStory] = useState<StoryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mobile bottom sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'questions' | 'discussion'>('analysis');

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

  // Analysis tab state
  const [sentenceInput, setSentenceInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{role: 'user' | 'assistant'; content: string}[]>([]);
  const [followUpQuestion, setFollowUpQuestion] = useState("");


  const handleGenerateStory = async (level: string, topic: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-story`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            hskLevel: level,
            topic: topic || '',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate story');
      }

      const data: StoryData = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setStory(data);

      toast.success("Story generated successfully!", {
        description: `Generated for ${level}${topic ? ` about "${topic}"` : ""}`,
      });
    } catch (error) {
      console.error('Error generating story:', error);
      toast.error("Failed to generate story", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabClick = (tab: 'analysis' | 'questions' | 'discussion') => {
    setActiveTab(tab);
    setSheetOpen(true);
  };

  const getSheetTitle = () => {
    switch (activeTab) {
      case 'analysis':
        return 'Analysis';
      case 'questions':
        return 'Questions';
      case 'discussion':
        return 'Open-Ended Questions';
      default:
        return '';
    }
  };

  // Questions tab handlers
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

  // Open-ended questions tab handlers
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

  // Analysis tab handlers
  const handleAnalyze = async () => {
    if (!story || !sentenceInput.trim()) {
      toast.error("Please enter a sentence to analyze");
      return;
    }

    setIsAnalyzing(true);

    try {
      const userMessage = {
        role: 'user' as const,
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
            hskLevel: 'HSK 1-6',
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

      const assistantMessage = {
        role: 'assistant' as const,
        content: data.analysis
      };

      setConversationHistory([userMessage, assistantMessage]);
      setSentenceInput("");

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
      const userMessage = {
        role: 'user' as const,
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

      const assistantMessage = {
        role: 'assistant' as const,
        content: data.analysis
      };

      setConversationHistory([...updatedHistory, assistantMessage]);
      setFollowUpQuestion("");

    } catch (error) {
      console.error('Error getting follow-up response:', error);
      toast.error("Failed to get response", {
        description: error instanceof Error ? error.message : "Please try again",
      });
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
    <div className="flex flex-col h-screen bg-background">
      {/* Header with branding */}
      <header className="bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-primary-foreground shadow-elegant">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-secondary/20 p-2 rounded-lg">
              <Languages className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">中文学习 Chinese Practice</h1>
              <p className="text-primary-foreground/80 text-sm">Master Chinese through immersive stories</p>
            </div>
          </div>
        </div>
      </header>

      {/* Story Generator Controls */}
      <StoryGenerator onGenerate={handleGenerateStory} />

      {/* Mobile Layout (< lg breakpoint) */}
      <main className="flex-1 overflow-hidden lg:hidden flex flex-col">
        {/* Story Display - Takes remaining space */}
        <div className="flex-1 overflow-hidden">
          <StoryDisplay story={story} isLoading={isLoading} />
        </div>

        {/* Fixed Bottom Tab Buttons - Doesn't overlap content */}
        {story && !isLoading && (
          <div className="flex-none border-t border-border bg-background/95 backdrop-blur-sm">
            <div className="flex gap-2 p-2 justify-center">
              <FloatingTabs
                onTabClick={handleTabClick}
                activeTab={activeTab}
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {/* Bottom Sheet - Always renders AnalysisPanel to preserve state */}
        <MobileBottomSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title={getSheetTitle()}
        >
            <AnalysisPanel
              story={story}
              activeTab={activeTab}
              isMobile={true}
              // Questions tab props
              questions={questions}
              currentQuestionIndex={currentQuestionIndex}
              answer={answer}
              setAnswer={setAnswer}
              isGeneratingQuestions={isGeneratingQuestions}
              isReviewingAnswer={isReviewingAnswer}
              currentReview={currentReview}
              showReview={showReview}
              isCompleted={isCompleted}
              questionsCollapsed={questionsCollapsed}
              setQuestionsCollapsed={setQuestionsCollapsed}
              handleGenerateQuestions={handleGenerateQuestions}
              handleSubmitAnswer={handleSubmitAnswer}
              handleNextQuestion={handleNextQuestion}
              handleRestartQuestions={handleRestartQuestions}
              // Open-ended questions tab props
              openEndedQuestions={openEndedQuestions}
              currentOpenEndedIndex={currentOpenEndedIndex}
              openEndedAnswer={openEndedAnswer}
              setOpenEndedAnswer={setOpenEndedAnswer}
              isGeneratingOpenEnded={isGeneratingOpenEnded}
              isReviewingOpenEnded={isReviewingOpenEnded}
              currentOpenEndedReview={currentOpenEndedReview}
              showOpenEndedReview={showOpenEndedReview}
              isOpenEndedCompleted={isOpenEndedCompleted}
              openEndedCollapsed={openEndedCollapsed}
              setOpenEndedCollapsed={setOpenEndedCollapsed}
              handleGenerateOpenEnded={handleGenerateOpenEnded}
              handleSubmitOpenEndedAnswer={handleSubmitOpenEndedAnswer}
              handleNextOpenEndedQuestion={handleNextOpenEndedQuestion}
              handleRestartOpenEnded={handleRestartOpenEnded}
              // Analysis tab props
              sentenceInput={sentenceInput}
              setSentenceInput={setSentenceInput}
              isAnalyzing={isAnalyzing}
              conversationHistory={conversationHistory}
              followUpQuestion={followUpQuestion}
              setFollowUpQuestion={setFollowUpQuestion}
              handleAnalyze={handleAnalyze}
              handleFollowUp={handleFollowUp}
              handleClearConversation={handleClearConversation}
            />
          </MobileBottomSheet>
      </main>

      {/* Desktop Layout (>= lg breakpoint) */}
      <main className="hidden lg:block flex-1 overflow-hidden">
        <div className="h-full p-6 gap-6 flex">
          {/* Left Column - Story Display (40%) */}
          <div className="w-[40%] h-full">
            <StoryDisplay story={story} isLoading={isLoading} />
          </div>

          {/* Right Column - Analysis Panel (60%) */}
          <div className="w-[60%] h-full">
            <AnalysisPanel
              story={story}
              // Questions tab props
              questions={questions}
              currentQuestionIndex={currentQuestionIndex}
              answer={answer}
              setAnswer={setAnswer}
              isGeneratingQuestions={isGeneratingQuestions}
              isReviewingAnswer={isReviewingAnswer}
              currentReview={currentReview}
              showReview={showReview}
              isCompleted={isCompleted}
              questionsCollapsed={questionsCollapsed}
              setQuestionsCollapsed={setQuestionsCollapsed}
              handleGenerateQuestions={handleGenerateQuestions}
              handleSubmitAnswer={handleSubmitAnswer}
              handleNextQuestion={handleNextQuestion}
              handleRestartQuestions={handleRestartQuestions}
              // Open-ended questions tab props
              openEndedQuestions={openEndedQuestions}
              currentOpenEndedIndex={currentOpenEndedIndex}
              openEndedAnswer={openEndedAnswer}
              setOpenEndedAnswer={setOpenEndedAnswer}
              isGeneratingOpenEnded={isGeneratingOpenEnded}
              isReviewingOpenEnded={isReviewingOpenEnded}
              currentOpenEndedReview={currentOpenEndedReview}
              showOpenEndedReview={showOpenEndedReview}
              isOpenEndedCompleted={isOpenEndedCompleted}
              openEndedCollapsed={openEndedCollapsed}
              setOpenEndedCollapsed={setOpenEndedCollapsed}
              handleGenerateOpenEnded={handleGenerateOpenEnded}
              handleSubmitOpenEndedAnswer={handleSubmitOpenEndedAnswer}
              handleNextOpenEndedQuestion={handleNextOpenEndedQuestion}
              handleRestartOpenEnded={handleRestartOpenEnded}
              // Analysis tab props
              sentenceInput={sentenceInput}
              setSentenceInput={setSentenceInput}
              isAnalyzing={isAnalyzing}
              conversationHistory={conversationHistory}
              followUpQuestion={followUpQuestion}
              setFollowUpQuestion={setFollowUpQuestion}
              handleAnalyze={handleAnalyze}
              handleFollowUp={handleFollowUp}
              handleClearConversation={handleClearConversation}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
