import { Brain, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingTabsProps {
  onTabClick: (tab: 'analysis' | 'questions' | 'discussion') => void;
  activeTab?: 'analysis' | 'questions' | 'discussion';
  disabled?: boolean;
}

export const FloatingTabs = ({ onTabClick, activeTab, disabled }: FloatingTabsProps) => {
  return (
    <div className="flex gap-2">
      <Button
        variant={activeTab === 'analysis' ? 'default' : 'ghost'}
        size="default"
        className="rounded-full min-h-[44px] px-4 flex-1"
        onClick={() => onTabClick('analysis')}
        disabled={disabled}
      >
        <Brain className="h-5 w-5 mr-2" />
        <span className="text-sm font-medium">Analysis</span>
      </Button>

      <Button
        variant={activeTab === 'questions' ? 'default' : 'ghost'}
        size="default"
        className="rounded-full min-h-[44px] px-4 flex-1"
        onClick={() => onTabClick('questions')}
        disabled={disabled}
      >
        <FileText className="h-5 w-5 mr-2" />
        <span className="text-sm font-medium">Questions</span>
      </Button>

      <Button
        variant={activeTab === 'discussion' ? 'default' : 'ghost'}
        size="default"
        className="rounded-full min-h-[44px] px-4 flex-1"
        onClick={() => onTabClick('discussion')}
        disabled={disabled}
      >
        <MessageSquare className="h-5 w-5 mr-2" />
        <span className="text-sm font-medium">Open-Ended</span>
      </Button>
    </div>
  );
};
