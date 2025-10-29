import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
            <div className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="sentence-input" className="text-base">
                  Paste a sentence you don't understand:
                </Label>
                <Textarea 
                  id="sentence-input"
                  placeholder="e.g., 我喜欢去公园。"
                  className="min-h-[100px]"
                />
                <Button className="w-full sm:w-auto">
                  Analyze Sentence
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Analysis Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm">
                      <span className="font-bold">Translation:</span> Placeholder: This is my weekend.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-bold">Grammar:</span> Placeholder: [Sentence breakdown will appear here...]
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
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
