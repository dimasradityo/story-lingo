import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles } from "lucide-react";

interface StoryGeneratorProps {
  onGenerate: (level: string, topic: string) => void;
}

export const StoryGenerator = ({ onGenerate }: StoryGeneratorProps) => {
  const [hskLevel, setHskLevel] = useState<string>("");
  const [topic, setTopic] = useState<string>("");

  const handleGenerate = () => {
    if (hskLevel) {
      onGenerate(hskLevel, topic);
    }
  };

  return (
    <div className="border-b border-border bg-gradient-to-r from-background to-muted/30 p-6 shadow-sm">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="hsk-level" className="text-sm font-medium mb-2 block">
              HSK Level
            </Label>
            <Select value={hskLevel} onValueChange={setHskLevel}>
              <SelectTrigger id="hsk-level" className="w-full bg-background">
                <SelectValue placeholder="Select HSK..." />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="HSK 1">HSK 1</SelectItem>
                <SelectItem value="HSK 2">HSK 2</SelectItem>
                <SelectItem value="HSK 3">HSK 3</SelectItem>
                <SelectItem value="HSK 4">HSK 4</SelectItem>
                <SelectItem value="HSK 5">HSK 5</SelectItem>
                <SelectItem value="HSK 6">HSK 6</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-[2] min-w-[300px]">
            <Label htmlFor="topic" className="text-sm font-medium mb-2 block">
              Story Topic <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="topic"
              type="text"
              placeholder="e.g., A trip to Beijing..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!hskLevel}
            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-elegant transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
            size="lg"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Story
          </Button>
        </div>
      </div>
    </div>
  );
};
