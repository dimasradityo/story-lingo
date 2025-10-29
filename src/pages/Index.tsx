import { useState } from "react";
import { StoryGenerator } from "@/components/StoryGenerator";
import { StoryDisplay } from "@/components/StoryDisplay";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { Languages } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [story, setStory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateStory = async (level: string, topic: string) => {
    setIsLoading(true);
    
    // Simulate API call - replace with actual implementation later
    setTimeout(() => {
      const sampleStory = `这是一个关于中国文化的故事。小明是一个学生，他每天都去学校学习。今天是星期一，天气很好。小明很高兴，因为他要和朋友们一起去公园玩。

在公园里，他们看到了很多美丽的花。小明的朋友小红说："这些花真漂亮！"小明说："是的，我们拍几张照片吧。"

他们在公园里玩了很长时间，玩得很开心。下午四点，他们回家了。小明觉得今天是很好的一天。`;
      
      setStory(sampleStory);
      setIsLoading(false);
      
      toast.success("Story generated successfully!", {
        description: `Generated for ${level}${topic ? ` about "${topic}"` : ""}`,
      });
    }, 2000);
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
