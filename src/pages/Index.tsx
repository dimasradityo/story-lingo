import { useState } from "react";
import { StoryGenerator } from "@/components/StoryGenerator";
import { StoryDisplay } from "@/components/StoryDisplay";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { Languages } from "lucide-react";
import { toast } from "sonner";

interface StoryData {
  hanzi: string;
  pinyin: string;
  error?: string;
}

const Index = () => {
  const [story, setStory] = useState<StoryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateStory = async (level: string, topic: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-story`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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

      {/* Main Content Area - Two Column Layout */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full p-6 gap-6 flex">
          {/* Left Column - Story Display (40%) */}
          <div className="w-[40%] h-full">
            <StoryDisplay story={story} isLoading={isLoading} />
          </div>

          {/* Right Column - Analysis Panel (60%) */}
          <div className="w-[60%] h-full">
            <AnalysisPanel hasStory={!!story} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
