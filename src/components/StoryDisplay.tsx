import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface StoryDisplayProps {
  story: string | null;
  isLoading: boolean;
}

export const StoryDisplay = ({ story, isLoading }: StoryDisplayProps) => {
  const [viewMode, setViewMode] = useState<string>("hanzi");

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-4">
        <CardTitle>Generated Story</CardTitle>
        <ToggleGroup type="single" variant="outline" value={viewMode} onValueChange={setViewMode}>
          <ToggleGroupItem value="hanzi" aria-label="Show Hanzi">
            汉字
          </ToggleGroupItem>
          <ToggleGroupItem value="pinyin" aria-label="Show Pinyin">
            Pīnyīn
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
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
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">我的周末</h2>
              
              <p className="text-foreground leading-relaxed text-base">
                这是我的周末。我喜欢去公园。公园里有很多人。他们有的在跑步，有的在跳舞。
              </p>
              
              <p className="text-foreground leading-relaxed text-base">
                上午十点，我和朋友见面了。我们一起喝咖啡，聊了很长时间。天气很好，阳光很温暖。我们决定去爬山。山上的风景很美，我们拍了很多照片。
              </p>
              
              <p className="text-foreground leading-relaxed text-base">
                下午，我们去了一家中国餐馆吃午饭。食物很好吃，特别是饺子和炒面。服务员很友好，给我们推荐了很多菜。我们吃得很饱，很开心。
              </p>
              
              <p className="text-foreground leading-relaxed text-base">
                晚上，我回到家里看了一部中国电影。电影很有意思，讲的是一个家庭的故事。看完电影后，我读了一会儿书，然后就睡觉了。这是一个美好的周末。
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
