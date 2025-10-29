import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, MessageSquare, FileText } from "lucide-react";

interface AnalysisPanelProps {
  hasStory: boolean;
}

export const AnalysisPanel = ({ hasStory }: AnalysisPanelProps) => {
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

        <ScrollArea className="flex-1">
          <TabsContent value="analysis" className="p-6 m-0">
            {hasStory ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Story Analysis</h3>
                <p className="text-muted-foreground text-sm">
                  Analysis tools will help you understand vocabulary, grammar patterns, and sentence structure.
                </p>
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground italic">
                    Analysis features coming soon...
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <p className="text-muted-foreground text-sm">
                  Generate a story to see analysis tools
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="questions" className="p-6 m-0">
            {hasStory ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Practice Questions</h3>
                <p className="text-muted-foreground text-sm">
                  Test your understanding with comprehension questions based on the story.
                </p>
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground italic">
                    Question generation coming soon...
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <p className="text-muted-foreground text-sm">
                  Generate a story to see practice questions
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="discussion" className="p-6 m-0">
            {hasStory ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Open Discussion</h3>
                <p className="text-muted-foreground text-sm">
                  Practice your Chinese with open-ended questions about the story.
                </p>
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground italic">
                    Discussion prompts coming soon...
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <p className="text-muted-foreground text-sm">
                  Generate a story to see discussion topics
                </p>
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
