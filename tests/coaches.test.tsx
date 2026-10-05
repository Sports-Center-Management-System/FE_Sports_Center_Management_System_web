import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { CoachesPage } from "../src/features/coaches";
import { coachApiService } from "../src/features/coaches/services/coach-api.service";
import type { Coach, Discipline } from "../src/features/coaches/types/coach.types";

const mockDisciplines: Discipline[] = [
  { id: "disc-gym-1", code: "GYM", name: "Gym & Fitness" },
  { id: "disc-box-2", code: "BOXING", name: "Boxing & Kickboxing" },
  { id: "disc-yog-3", code: "YOGA", name: "Yoga & Meditation" },
];

const mockCoaches: Coach[] = [
  {
    id: "coach-1",
    fullName: "Nguyễn Văn Hùng",
    avatarUrl: null, // null URL -> displays initials placeholder
    phone: "0901234567",
    email: "hung.nguyen@elitefitness.vn",
    disciplineIds: ["disc-gym-1"],
    disciplineCodes: ["GYM"],
    primaryDiscipline: "GYM",
    experienceYears: 7,
    title: "HLV Chuyên Sâu GYM",
    bio: "Chuyên gia huấn luyện thể hình và tăng cơ giảm mỡ chuẩn NASM.",
    coachProfile: {
      id: "cp-1",
      userId: "coach-1",
      yearsExperience: 7,
      specialties: "GYM",
      bio: "Chuyên gia huấn luyện thể hình và tăng cơ giảm mỡ chuẩn NASM.",
      coachSpecialties: [
        {
          id: "cs-1",
          coachProfileId: "cp-1",
          specialtyId: "spec-1",
          specialty: {
            id: "spec-1",
            disciplineId: "disc-gym-1",
            code: "SPEC_GYM_BB",
            name: "Hypertrophy & Tăng cơ chuyên sâu",
          },
        },
      ],
    },
    coachRates: [
      {
        id: "rate-1",
        coachId: "coach-1",
        disciplineId: "disc-gym-1",
        ratePerSession: 450000,
        effectiveFrom: "2026-01-01T00:00:00.000Z",
        effectiveTo: null,
      },
    ],
  },
  {
    id: "coach-2",
    fullName: "Trần Thị Mai Lan",
    avatarUrl: null,
    phone: "0912345678",
    email: "lan.tran@elitefitness.vn",
    disciplineIds: ["disc-yog-3"],
    disciplineCodes: ["YOGA"],
    primaryDiscipline: "YOGA",
    experienceYears: 6,
    title: "HLV Chuyên Sâu YOGA",
    bio: "Master Yoga Alliance 500h chuyên sâu Yoga phục hồi trị liệu cột sống.",
    coachProfile: {
      id: "cp-2",
      userId: "coach-2",
      yearsExperience: 6,
      specialties: "YOGA",
      bio: "Master Yoga Alliance 500h.",
      coachSpecialties: [
        {
          id: "cs-2",
          coachProfileId: "cp-2",
          specialtyId: "spec-2",
          specialty: {
            id: "spec-2",
            disciplineId: "disc-yog-3",
            code: "SPEC_YOG_AS",
            name: "Hatha & Vinyasa Yoga Flow",
          },
        },
      ],
    },
    coachRates: [
      {
        id: "rate-2",
        coachId: "coach-2",
        disciplineId: "disc-yog-3",
        ratePerSession: 500000,
        effectiveFrom: "2026-01-01T00:00:00.000Z",
        effectiveTo: null,
      },
    ],
  },
];

describe("Coaches Feature (/api/v1/coaches)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(coachApiService, "getDisciplines").mockResolvedValue(mockDisciplines);
    vi.spyOn(coachApiService, "getCoaches").mockResolvedValue(mockCoaches);
    vi.spyOn(coachApiService, "getCoachDetail").mockImplementation(async (id) => {
      const found = mockCoaches.find((c) => c.id === id);
      return found || mockCoaches[0];
    });
    vi.spyOn(coachApiService, "getAvailability").mockResolvedValue([
      {
        id: "slot-1",
        coachId: "coach-1",
        startTime: "09:00",
        endTime: "10:00",
        isBooked: false,
      },
    ]);
  });

  const createWrapper = () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };

  it("renders page title, discipline tabs, and discipline carousel sections", async () => {
    render(<CoachesPage />, { wrapper: createWrapper() });

    // Verify Page Title
    expect(screen.getByText("Đội ngũ Huấn luyện viên chuyên biệt")).toBeDefined();

    // Verify Discipline tabs (loaded dynamically from disciplines API)
    expect(screen.getByText("Tất cả bộ môn")).toBeDefined();
    expect(await screen.findAllByText("Gym & Fitness")).toBeDefined();
    expect(screen.getAllByText("Boxing & Kickboxing")).toBeDefined();
    expect(screen.getAllByText("Yoga & Meditation")).toBeDefined();

    // Verify Coaches rendered under their respective sections
    expect(await screen.findByText("Nguyễn Văn Hùng")).toBeDefined();
    expect(screen.getByText("Trần Thị Mai Lan")).toBeDefined();

    // Verify Initials Avatar Placeholder (null avatarUrl -> NH and TL)
    expect(screen.getByText("NH")).toBeDefined();
    expect(screen.getByText("TL")).toBeDefined();

    // Verify Horizontal Navigation Arrows for Gym section
    expect(screen.getByLabelText("Cuộn trái danh sách HLV Gym & Fitness")).toBeDefined();
    expect(screen.getByLabelText("Cuộn phải danh sách HLV Gym & Fitness")).toBeDefined();
  });

  it("filters coaches by discipline tab", async () => {
    render(<CoachesPage />, { wrapper: createWrapper() });

    // Wait for initial load
    expect(await screen.findByText("Nguyễn Văn Hùng")).toBeDefined();

    // Click on Yoga tab
    const yogaTab = (await screen.findAllByText("Yoga & Meditation"))[0];
    fireEvent.click(yogaTab);

    // Verify Yoga section is shown and Gym section is hidden
    await waitFor(() => {
      expect(screen.getByText("Trần Thị Mai Lan")).toBeDefined();
      expect(screen.queryByText("Nguyễn Văn Hùng")).toBeNull();
    });
  });

  it("opens coach detail modal with live rate, specialties, and availability slots", async () => {
    render(<CoachesPage />, { wrapper: createWrapper() });

    const coachCard = await screen.findByText("Nguyễn Văn Hùng");
    fireEvent.click(coachCard);

    // Verify modal elements
    expect(await screen.findByText("Biểu phí dạy kèm 1:1 (Coach Rate)")).toBeDefined();
    expect(screen.getAllByText(/450\.000/).length).toBeGreaterThan(0);

    // Verify specialties mapping
    expect(screen.getByText("Chuyên môn kỹ thuật (Coach Specialties)")).toBeDefined();
    expect(screen.getAllByText("Hypertrophy & Tăng cơ chuyên sâu").length).toBeGreaterThan(0);

    // Verify availability slots
    expect(screen.getByText("Khung giờ dạy kèm mở rảnh (Availability Slots)")).toBeDefined();
    expect(screen.getByText("09:00 - 10:00")).toBeDefined();
  });
});
