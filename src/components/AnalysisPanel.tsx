import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
            <div className="space-y-6">
              <Button className="w-full sm:w-auto">
                Generate 5 Questions
              </Button>

              <div className="space-y-6">
                {[1, 2, 3, 4, 5].map((num) => (
                  <div key={num} className="space-y-2">
                    <Label className="text-sm font-normal text-muted-foreground">
                      {num}. [Placeholder for question {num}...]
                    </Label>
                    <Input placeholder="Type your answer here..." />
                  </div>
                ))}
              </div>

              <Button variant="secondary" className="w-full sm:w-auto">
                Review My Answers
              </Button>

              <Card>
                <CardHeader>
                  <CardTitle>Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Your review will appear here...
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="discussion" className="p-6 m-0">
            <div className="space-y-6">
              <Button className="w-full sm:w-auto">
                Generate 3 Open Questions
              </Button>

              <Card>
                <CardContent className="pt-6">
                  <ol className="space-y-3 list-decimal list-inside">
                    <li className="text-sm text-muted-foreground">
                      [Placeholder for open question 1...]
                    </li>
                    <li className="text-sm text-muted-foreground">
                      [Placeholder for open question 2...]
                    </li>
                    <li className="text-sm text-muted-foreground">
                      [Placeholder for open question 3...]
                    </li>
                  </ol>
                </CardContent>
              </Card>

              <Textarea 
                placeholder="Practice writing your answers here..."
                className="min-h-[200px]"
                rows={8}
              />
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
