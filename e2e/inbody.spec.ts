import { expect, test, type Page } from '@playwright/test'
import type { InbodyLog } from '../src/lib/types'

test.use({ baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5173' })

// Fixtures are confined to browser tests; the page continues to use its real API.
const logs: InbodyLog[] = [
  {
    id: 'latest',
    measuredAt: '2026-10-06T03:00:00Z',
    weightKg: '68.4',
    bodyFatPct: '18.2',
    muscleMassKg: '31.6',
    bmi: '22.3',
  },
  {
    id: 'first',
    measuredAt: '2026-08-06T03:00:00Z',
    weightKg: '72.5',
    bodyFatPct: '22.4',
    muscleMassKg: '30.1',
    bmi: '23.7',
  },
  {
    id: 'previous',
    measuredAt: '2026-09-06T03:00:00Z',
    weightKg: '70.2',
    bodyFatPct: '20.1',
    muscleMassKg: '30.8',
    bmi: '22.9',
  },
]

async function serveProgress(page: Page, measurements = logs) {
  await page.route('**/api/v1/inbody/my-progress', (route) =>
    route.fulfill({ json: { success: true, data: { logs: measurements } } }),
  )
}

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ contentType: 'text/css', body: '' }),
  )
  await page.addInitScript(() => {
    localStorage.setItem(
      'sportscenter.member.tokens',
      JSON.stringify({ accessToken: 'test-access', refreshToken: 'test-refresh' }),
    )
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: 'member-1',
        fullName: 'Nguyễn Minh Anh',
        email: 'member@example.test',
        role: 'MEMBER',
      }),
    )
  })
  await serveProgress(page)
})

for (const [label, width] of [
  ['desktop', 1440],
  ['tablet', 1024],
  ['small-tablet', 768],
  ['mobile', 390],
  ['small-mobile', 320],
] as const) {
  test(`InBody hierarchy and controls on ${label}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    const modelResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith('/models/inbody-human.glb') &&
        response.request().method() === 'GET',
    )
    await page.goto('/portal/member/progress')
    await expect(page.getByRole('heading', { name: 'Chỉ số cơ thể' })).toBeInViewport()
    expect((await modelResponse).status()).toBe(200)
    const viewer = page.getByRole('region', { name: 'Tổng quan cơ thể 3D', exact: true })
    const chart = page.getByRole('region', { name: 'Sơ đồ quá trình cải thiện', exact: true })
    const latest = page.getByRole('region', { name: 'Lần đo mới nhất', exact: true })
    const comparison = page.getByRole('region', { name: 'So sánh các lần đo', exact: true })
    const history = page.getByRole('region', { name: 'Lịch sử InBody', exact: true })
    await expect(viewer.locator('canvas')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Góc nhìn trước' })).toBeEnabled()
    await expect(chart.locator('.recharts-line-curve')).toHaveCount(1)
    const boxes = await Promise.all(
      [viewer, chart, latest, comparison, history].map((locator) => locator.boundingBox()),
    )
    const [viewerBox, chartBox, latestBox, comparisonBox, historyBox] = boxes.map((box) => box!)
    if (width >= 1280) {
      expect(Math.abs(viewerBox.y - chartBox.y)).toBeLessThan(2)
      expect(chartBox.x).toBeGreaterThan(viewerBox.x + viewerBox.width)
      expect(Math.abs(viewerBox.height - chartBox.height)).toBeLessThan(2)
    } else {
      expect(chartBox.y).toBeGreaterThan(viewerBox.y + viewerBox.height)
    }
    expect(latestBox.y).toBeGreaterThan(
      Math.max(viewerBox.y + viewerBox.height, chartBox.y + chartBox.height),
    )
    expect(comparisonBox.y).toBeGreaterThan(latestBox.y + latestBox.height)
    expect(historyBox.y).toBeGreaterThan(comparisonBox.y + comparisonBox.height)
    expect(boxes.every((box) => box && box.x >= 0 && box.x + box.width <= width)).toBe(true)
    expect(
      await page
        .locator('main')
        .last()
        .evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true)
    expect(
      await chart.locator('.inbody-chart-plot').evaluate((element) => element.clientHeight),
    ).toBeGreaterThanOrEqual(340)
    await expect(latest.getByText('68,4')).toBeVisible()
    await expect(latest.getByText('−1,8 kg')).toBeVisible()
    await expect(history.getByText('3 lần đo')).toBeVisible()
    const historyRows = history.locator('tbody tr')
    await expect(historyRows).toHaveCount(3)
    await expect(historyRows.first()).toContainText('06/10/2026')
    await expect(historyRows.first()).toContainText('68,4 kg')
    expect(await history.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    )

    await page.getByRole('button', { name: 'Góc nhìn bên' }).click()
    await expect(page.getByRole('button', { name: 'Góc nhìn bên' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await page.getByRole('button', { name: 'Tự xoay mô hình' }).click()
    await expect(page.getByRole('button', { name: 'Tự xoay mô hình' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await page.getByRole('button', { name: 'Đặt lại camera' }).click()
    await expect(page.getByRole('button', { name: 'Góc nhìn trước' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await chart.getByLabel('Chọn chỉ số theo dõi').selectOption('bodyFatPct')
    await expect(chart.getByText('Theo từng lần đo · Mỡ cơ thể (%)')).toBeVisible()
    await expect(chart.locator('.recharts-line-curve')).toHaveCount(1)
    await page
      .locator('main')
      .last()
      .evaluate((element) => {
        element.scrollTop = 0
      })
    await page.screenshot({ path: testInfo.outputPath(`${label}.png`), fullPage: true })
    await latest.screenshot({ path: testInfo.outputPath(`${label}-latest.png`) })
    await chart.screenshot({ path: testInfo.outputPath(`${label}-chart.png`) })
    await comparison.screenshot({ path: testInfo.outputPath(`${label}-comparison.png`) })
    await history.screenshot({ path: testInfo.outputPath(`${label}-history.png`) })
    expect(errors).toEqual([])
  })
}

test('empty progress retains the model and does not invent measurements', async ({ page }) => {
  await serveProgress(page, [])
  await page.goto('/portal/member/progress')
  await expect(
    page.getByText('Bạn chưa có lần đo InBody nào. Các chỉ số sẽ xuất hiện sau lần đo đầu tiên.'),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Sơ đồ quá trình cải thiện' })).toBeVisible()
  await expect(page.locator('.inbody-chart-plot')).toHaveText(
    'Chưa có dữ liệu cân nặng để hiển thị biểu đồ.',
  )
  await expect(
    page.getByRole('region', { name: 'Lần đo mới nhất', exact: true }).getByText('—'),
  ).toHaveCount(4)
  await expect(page.getByRole('region', { name: 'So sánh các lần đo' })).toHaveCount(0)
  await expect(page.getByText('0 lần đo')).toBeVisible()
})

test('single, missing and undated measurements keep existing data semantics', async ({ page }) => {
  await serveProgress(page, [
    { ...logs[0], bodyFatPct: null },
    { ...logs[1], id: 'undated', measuredAt: 'invalid-date' },
  ])
  await page.goto('/portal/member/progress')
  await expect(page.getByText('Cần thêm lần đo để xem xu hướng.')).toBeVisible()
  await expect(page.getByText(/1 bản ghi chưa có ngày đo hợp lệ/)).toBeVisible()
  await expect(page.getByRole('region', { name: 'So sánh các lần đo' })).toHaveCount(0)
  await expect(
    page.getByRole('region', { name: 'Lịch sử InBody', exact: true }).locator('tbody tr'),
  ).toHaveCount(2)
  await page.getByLabel('Chọn chỉ số theo dõi').selectOption('bodyFatPct')
  await expect(page.locator('.inbody-chart-plot')).toHaveText(
    'Chưa có dữ liệu mỡ cơ thể để hiển thị biểu đồ.',
  )
})

test('missing model keeps chart, latest measurement, comparison and history available', async ({
  page,
}) => {
  await page.route('**/models/inbody-human.glb', (route) =>
    route.fulfill({ status: 404, body: '' }),
  )
  await page.goto('/portal/member/progress')
  await expect(page.getByText('3D body model chưa được cấu hình')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Góc nhìn trước' })).toBeDisabled()
  await expect(page.getByRole('heading', { name: 'Sơ đồ quá trình cải thiện' })).toBeVisible()
  await expect(
    page.getByRole('region', { name: 'Lần đo mới nhất', exact: true }).getByText('68,4'),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'So sánh', exact: true })).toBeVisible()
  await expect(page.getByText('3 lần đo', { exact: true })).toBeVisible()
})
