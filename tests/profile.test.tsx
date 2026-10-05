import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { SessionContext } from "../src/auth/session-context";
import { ProfilePage } from "../src/features/member";
import { saveTokens } from "../src/lib/api";

describe("Profile Page (M10 / W16)", () => {
  it("renders profile with full fields, avatar fallback, and gender placeholder", async () => {
    localStorage.removeItem("sportscenter.mock_profile");
    saveTokens({ accessToken: "test-token", refreshToken: "test-refresh" });

    const mockUser = {
      id: "user-123",
      email: "alex@sportscenter.vn",
      fullName: "Alex Ferguson",
      phone: "0912345678",
      role: "MEMBER" as const,
      avatarUrl: "",
      gender: "MALE" as const,
      fitnessGoals: "Tăng 2kg cơ bắp",
      medicalHistory: "Không có bệnh lý nền",
      heightCm: 180,
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            data: mockUser,
          }),
          { status: 200 }
        )
      )
    );

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <SessionContext.Provider
          value={{
            state: "authenticated",
            user: mockUser,
            accept: vi.fn(),
            verify: vi.fn(),
            logout: vi.fn(),
          }}
        >
          <MemoryRouter>
            <ProfilePage />
          </MemoryRouter>
        </SessionContext.Provider>
      </QueryClientProvider>
    );

    // Check name, email, role badge
    expect(await screen.findByText("Alex Ferguson")).toBeDefined();
    expect(screen.getByText("alex@sportscenter.vn")).toBeDefined();
    expect(screen.getByText("Hội viên chính thức")).toBeDefined();

    // Check gender placeholder (Nam / ♂)
    expect(screen.getByText(/Giới tính: Nam/)).toBeDefined();

    // Check empty avatar fallback text
    expect(screen.getByText("Chưa có ảnh")).toBeDefined();

    // Check fitness goals and medical history fields
    expect(screen.getByDisplayValue("Tăng 2kg cơ bắp")).toBeDefined();
    expect(screen.getByDisplayValue("Không có bệnh lý nền")).toBeDefined();
  });

  it("submits updated profile and triggers success notification", async () => {
    localStorage.removeItem("sportscenter.mock_profile");
    saveTokens({ accessToken: "test-token", refreshToken: "test-refresh" });

    const mockUser = {
      id: "user-123",
      email: "alex@sportscenter.vn",
      fullName: "Alex Ferguson",
      phone: "0912345678",
      role: "MEMBER" as const,
      avatarUrl: "",
      gender: "MALE" as const,
      fitnessGoals: "Tăng 2kg cơ",
      medicalHistory: "Không",
      heightCm: 175,
    };

    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === "PUT") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: {
                id: "user-123",
                fullName: "Alex Ferguson Updated",
                fitnessGoals: "Tăng 3kg cơ",
              },
            }),
            { status: 200 }
          )
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            data: mockUser,
          }),
          { status: 200 }
        )
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <SessionContext.Provider
          value={{
            state: "authenticated",
            user: mockUser,
            accept: vi.fn(),
            verify: vi.fn(),
            logout: vi.fn(),
          }}
        >
          <MemoryRouter>
            <ProfilePage />
          </MemoryRouter>
        </SessionContext.Provider>
      </QueryClientProvider>
    );

    const nameInput = await screen.findByDisplayValue("Alex Ferguson");
    fireEvent.change(nameInput, { target: { value: "Alex Ferguson Updated" } });

    const submitBtn = screen.getByRole("button", { name: /Lưu thay đổi/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Hồ sơ cá nhân đã được lưu và cập nhật thành công!")
      ).toBeDefined();
    });
  });
});
