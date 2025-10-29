import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen } from "lucide-react";

interface StoryDisplayProps {
  story: string | null;
  isLoading: boolean;
}

export const StoryDisplay = ({ story, isLoading }: StoryDisplayProps) => {
  return (
    <div className="h-full flex flex-col bg-card rounded-lg border border-border shadow-soft overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Story</h2>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Generating your story...</p>
            </div>
          </div>
        ) : story ? (
          <div className="prose prose-lg max-w-none">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap text-base">
              {story}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3 max-w-md">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">No Story Yet</h3>
              <p className="text-muted-foreground text-sm">
                Select an HSK level and click "Generate Story" to begin your Chinese learning journey.
              </p>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
