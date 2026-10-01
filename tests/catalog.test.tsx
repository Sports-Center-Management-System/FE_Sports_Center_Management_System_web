import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { SessionContext } from '../src/auth/session-context'
import { PublicPlansPage } from '../src/pages/PublicPages'
const envelope = (data: unknown) =>
  new Response(JSON.stringify({ success: true, data }), { status: 200 })
describe('public plan catalog', () => {
  it('renders only plans returned by the API, with VIP base price identified', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve(
          envelope(
            url.includes('/disciplines')
              ? [{ id: 'yoga', code: 'YOGA', name: 'Yoga' }]
              : [
                  {
                    id: 'plan-1',
                    name: 'Yoga VIP',
                    disciplineId: 'yoga',
                    discipline: { name: 'Yoga' },
                    packageTier: 'VIP',
                    price: '600000',
                    durationDays: 30,
                    groupSessionQuota: 4,
                    ptSessionQuota: 12,
                    isActive: true,
                  },
                ],
          ),
        ),
      ),
    )
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <SessionContext.Provider
          value={{
            state: 'anonymous',
            user: null,
            accept: vi.fn(),
            verify: vi.fn(),
            logout: vi.fn(),
          }}
        >
          <MemoryRouter>
            <PublicPlansPage />
          </MemoryRouter>
        </SessionContext.Provider>
      </QueryClientProvider>,
    )
    expect(await screen.findByText('Yoga VIP')).toBeTruthy()
    expect(screen.getByText(/600\.000/)).toBeTruthy()
    expect(screen.queryByText('Boxing VIP')).toBeNull()
    expect(screen.getByRole('button', { name: 'Chọn HLV & báo giá' })).toBeTruthy()
  })
})
