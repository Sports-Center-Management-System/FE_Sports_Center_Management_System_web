import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Search,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
  Flame,
  Dumbbell,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PageTitle } from "@/components/common/page-title";
import { StateMessage } from "@/components/feedback/state-message";
import { coachApiService } from "../services/coach-api.service";
import { CoachCard, getDisciplineIcon } from "../components/coach-card";
import { CoachDetailModal } from "../components/coach-detail-modal";
import type { Coach, Discipline, DisciplineCode } from "../types/coach.types";
import { cn } from "@/lib/utils";

interface CoachesPageProps {
  isMemberView?: boolean;
}

const DISCIPLINE_TAGLINES: Record<string, string> = {
  GYM: "Tăng cơ, giảm mỡ, rèn luyện sức bền và thể lực toàn diện cùng các chuyên gia thể hình hàng đầu.",
  BOXING: "Tập luyện phản xạ, cardio cường độ cao, kỹ thuật tự vệ thực chiến và giải tỏa căng thẳng đỉnh cao.",
  YOGA: "Cân bằng thân - tâm - trí, cải thiện độ dẻo dai, thư giãn hơi thở và phục hồi xương khớp tự nhiên.",
  PILATES: "Định hình vóc dáng, siết cơ lõi chuyên sâu, tăng độ linh hoạt và cải thiện tư thế chuẩn xác.",
};

const DISCIPLINE_TABS: { id: DisciplineCode; label: string; icon: any }[] = [
  { id: "ALL", label: "Tất cả bộ môn", icon: Layers },
  { id: "GYM", label: "Gym & Thể hình", icon: Dumbbell },
  { id: "BOXING", label: "Boxing & Võ thuật", icon: Flame },
  { id: "YOGA", label: "Yoga & Trị liệu", icon: Sparkles },
  { id: "PILATES", label: "Pilates & Core", icon: Activity },
];

/**
 * Single Discipline Section with Horizontal Scroll Carousel & Navigation Arrows
 */
interface DisciplineCoachSectionProps {
  discipline: Discipline;
  tagline: string;
  coaches: Coach[];
  onOpenDetail: (coach: Coach) => void;
  onBookSession: (coach: Coach) => void;
}

const DisciplineCoachSection: React.FC<DisciplineCoachSectionProps> = ({
  discipline,
  tagline,
  coaches,
  onOpenDetail,
  onBookSession,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth + 8;
    setCanScroll(hasOverflow);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, coaches]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollStep = 380;
    if (direction === "left") {
      if (el.scrollLeft <= 15) {
        el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
      } else {
        el.scrollBy({ left: -scrollStep, behavior: "smooth" });
      }
    } else {
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 15) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: scrollStep, behavior: "smooth" });
      }
    }
  };

  const DiscIcon = getDisciplineIcon(discipline.code);

  return (
    <section className="space-y-4 pt-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#008b74] flex items-center justify-center shrink-0 shadow-xs">
            <DiscIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {discipline.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200/80">
                {coaches.length} HLV
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{tagline}</p>
          </div>
        </div>

        {/* Top Header Navigation Arrows */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => handleScroll("left")}
            disabled={!canScroll}
            aria-label={`Xem HLV ${discipline.name} trước`}
            title="Xem HLV trước"
            className={cn(
              "w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-all duration-200 shadow-xs",
              canScroll
                ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 cursor-pointer active:scale-95"
                : "bg-slate-50 border-slate-200/60 text-slate-300 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll("right")}
            disabled={!canScroll}
            aria-label={`Xem HLV ${discipline.name} tiếp theo`}
            title="Xem HLV tiếp theo"
            className={cn(
              "w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition-all duration-200 shadow-xs",
              canScroll
                ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 cursor-pointer active:scale-95"
                : "bg-slate-50 border-slate-200/60 text-slate-300 cursor-not-allowed"
            )}
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Row with Coach Cards and Floating Arrows */}
      <div className="relative group/row">
        {/* Floating Left Arrow */}
        {canScroll && (
          <button
            type="button"
            onClick={() => handleScroll("left")}
            aria-label={`Cuộn trái ${discipline.name}`}
            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/95 backdrop-blur-md shadow-xl border border-slate-200/90 text-slate-800 hover:bg-slate-900 hover:text-white items-center justify-center transition-all duration-200 cursor-pointer active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Horizontally Scrollable Coach Cards Track */}
        <div
          ref={scrollRef}
          className="flex gap-5 sm:gap-6 overflow-x-auto scroll-smooth py-2 px-1 snap-x snap-mandatory items-stretch"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {coaches.map((coach) => (
            <CoachCard
              key={`${discipline.id}-${coach.id}`}
              coach={coach}
              disciplineCode={discipline.code}
              className="w-[310px] sm:w-[350px] md:w-[370px] shrink-0 snap-start"
              onOpenDetail={onOpenDetail}
              onBookSession={onBookSession}
            />
          ))}
        </div>

        {/* Floating Right Arrow */}
        {canScroll && (
          <button
            type="button"
            onClick={() => handleScroll("right")}
            aria-label={`Cuộn phải ${discipline.name}`}
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/95 backdrop-blur-md shadow-xl border border-slate-200/90 text-slate-800 hover:bg-slate-900 hover:text-white items-center justify-center transition-all duration-200 cursor-pointer active:scale-90"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </section>
  );
};

export const CoachesPage: React.FC<CoachesPageProps> = ({ isMemberView = false }) => {
  const [selectedDiscipline, setSelectedDiscipline] = useState<DisciplineCode>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "rating">("default");
  const [activeCoachDetail, setActiveCoachDetail] = useState<Coach | null>(null);

  // 1. Fetch disciplines
  const disciplinesQuery = useQuery({
    queryKey: ["disciplines"],
    queryFn: () => coachApiService.getDisciplines(),
  });

  // 2. Fetch coaches
  const coachesQuery = useQuery({
    queryKey: ["coaches"],
    queryFn: () => coachApiService.getCoaches(),
  });

  // Filtered & grouped coaches by discipline
  const disciplineSections = useMemo(() => {
    const rawDisciplines: Discipline[] = disciplinesQuery.data || [];
    const allCoaches: Coach[] = coachesQuery.data || [];

    // Filter coaches by search query
    let filteredCoaches = allCoaches;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filteredCoaches = filteredCoaches.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.coachProfile?.coachSpecialties?.some((s) =>
            s.specialty?.name?.toLowerCase().includes(q)
          ) ||
          c.coachProfile?.specialties?.toLowerCase().includes(q)
      );
    }

    // Sort function
    const sortList = (list: Coach[]) => {
      return [...list].sort((a, b) => {
        const rateA = a.coachRates?.[0]?.ratePerSession ?? 500000;
        const rateB = b.coachRates?.[0]?.ratePerSession ?? 500000;
        if (sortBy === "price-asc") return rateA - rateB;
        if (sortBy === "price-desc") return rateB - rateA;
        if (sortBy === "rating") return b.rating - a.rating;
        return 0;
      });
    };

    // Filter disciplines by active tab
    const activeDisciplines =
      selectedDiscipline === "ALL"
        ? rawDisciplines
        : rawDisciplines.filter((d) => d.code.toUpperCase() === selectedDiscipline.toUpperCase());

    // Map each discipline to its matching coaches
    const sections = activeDisciplines
      .map((disc) => {
        const discCode = disc.code.toUpperCase();
        const discId = disc.id;

        const matchingCoaches = filteredCoaches.filter((coach) => {
          // Check disciplineCodes
          if (coach.disciplineCodes?.some((c) => c.toUpperCase() === discCode)) return true;
          // Check disciplineIds
          if (coach.disciplineIds?.includes(discId)) return true;
          // Check primaryDiscipline
          if (coach.primaryDiscipline?.toUpperCase() === discCode) return true;
          // Check coach specialties
          if (
            coach.coachProfile?.coachSpecialties?.some((s) => {
              const code = s.specialty?.code?.toUpperCase() || "";
              const name = s.specialty?.name?.toLowerCase() || "";
              if (discCode === "GYM" && (code.includes("GYM") || name.includes("gym") || name.includes("cơ"))) return true;
              if (discCode === "BOXING" && (code.includes("BOX") || name.includes("box") || name.includes("võ"))) return true;
              if (discCode === "YOGA" && (code.includes("YOG") || name.includes("yoga") || name.includes("thiền"))) return true;
              return false;
            })
          ) {
            return true;
          }
          return false;
        });

        return {
          discipline: disc,
          tagline:
            DISCIPLINE_TAGLINES[disc.code.toUpperCase()] ||
            "Đội ngũ Huấn luyện viên chuyên môn cao đồng hành 1:1 theo sát mục tiêu cá nhân.",
          coaches: sortList(matchingCoaches),
        };
      })
      .filter((s) => s.coaches.length > 0);

    return sections;
  }, [disciplinesQuery.data, coachesQuery.data, searchQuery, sortBy, selectedDiscipline]);

  const totalMatchingCoaches = useMemo(() => {
    return disciplineSections.reduce((acc, sec) => acc + sec.coaches.length, 0);
  }, [disciplineSections]);

  const isLoading = disciplinesQuery.isPending || coachesQuery.isPending;
  const error = disciplinesQuery.error || coachesQuery.error;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-24">
      {/* Header Eyebrow & Title */}
      <div className="space-y-2">
        <PageTitle
          eyebrow="COACHES & PERSONAL TRAINERS"
          title="Đội ngũ Huấn luyện viên chuyên biệt"
        />
        <p className="text-sm text-slate-500 max-w-2xl">
          Đạt chứng chỉ chuyên môn quốc tế ISSA, NASM, Yoga Alliance. Đồng hành 1:1,
          thiết kế giáo án riêng biệt và theo sát mục tiêu hình thể của bạn.
        </p>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
        {/* Discipline Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {DISCIPLINE_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = selectedDiscipline === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedDiscipline(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer border",
                  active
                    ? "!bg-[#008b74] !text-white !border-[#008b74] shadow-sm"
                    : "!bg-slate-100/90 !text-slate-600 !border-slate-200/80 hover:!bg-slate-200/70 hover:!text-slate-900"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", active ? "text-white" : "text-slate-500")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên HLV, kỹ thuật chuyên môn (Hypertrophy, Boxing, Yoga trị liệu...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl text-xs font-medium bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#008b74]/20 focus:border-[#008b74] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Xóa
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sắp xếp:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-11 px-3.5 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#008b74]/20"
            >
              <option value="default">Mặc định (Nổi bật)</option>
              <option value="rating">Đánh giá cao nhất (★)</option>
              <option value="price-asc">Biểu phí: Thấp đến cao</option>
              <option value="price-desc">Biểu phí: Cao đến thấp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      <StateMessage
        loading={isLoading}
        error={error}
        onRetry={() => {
          disciplinesQuery.refetch();
          coachesQuery.refetch();
        }}
      />

      {/* VERTICAL DISCIPLINE SECTIONS WITH HORIZONTAL CAROUSEL */}
      {!isLoading && disciplineSections.length > 0 ? (
        <div className="space-y-12">
          {disciplineSections.map((section) => (
            <DisciplineCoachSection
              key={section.discipline.id}
              discipline={section.discipline}
              tagline={section.tagline}
              coaches={section.coaches}
              onOpenDetail={(coach) => setActiveCoachDetail(coach)}
              onBookSession={(coach) => setActiveCoachDetail(coach)}
            />
          ))}
        </div>
      ) : (
        !isLoading && (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">
                Không tìm thấy Huấn luyện viên phù hợp
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Vui lòng thử từ khóa khác hoặc chuyển sang danh mục bộ môn khác.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedDiscipline("ALL");
                setSearchQuery("");
                setSortBy("default");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#008b74] text-white hover:bg-[#007360] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại bộ lọc</span>
            </button>
          </div>
        )
      )}

      {/* FULLSCREEN DETAIL MODAL */}
      <CoachDetailModal
        coach={activeCoachDetail}
        isOpen={Boolean(activeCoachDetail)}
        onClose={() => setActiveCoachDetail(null)}
      />
    </div>
  );
};

export default CoachesPage;
