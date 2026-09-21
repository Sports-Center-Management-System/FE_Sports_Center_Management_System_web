import React from "react";
import { Avatar } from "@/components/ui/avatar";
import { Sparkles, MessageCircle } from "lucide-react";

export interface AICoachCardProps {
  onChatClick?: () => void;
}

export const AICoachCard: React.FC<AICoachCardProps> = ({ onChatClick }) => {
  return (
    <div 
      onClick={onChatClick}
      className="group relative mx-4 mb-4 cursor-pointer rounded-2xl border border-slate-100 bg-[#f0f9f6] p-3.5 transition-all duration-200 hover:border-[#008b74]/30 hover:shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
            alt="AI Coach"
            fallback="AI"
            size="md"
            className="border-2 border-white shadow-sm ring-1 ring-emerald-300"
          />
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-bold text-slate-800 tracking-tight">AI Wellness Coach</h4>
            <Sparkles className="h-3 w-3 text-amber-500 shrink-0 fill-amber-400" />
          </div>
          <p className="text-[11px] font-medium text-[#008b74]">
            Trực tuyến 24/7
          </p>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
        Bạn cần gợi ý thực đơn hôm nay không? <span className="font-semibold text-slate-800">Hãy trò chuyện với tôi!</span>
      </p>
    </div>
  );
};
