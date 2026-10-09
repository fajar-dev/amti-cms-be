/**
 * Test Data Factories & Shared Utilities
 */

// ── User Test Data ──────────────────────────────────────────────────────────

let userCounter = 0

export function createUserData(overrides: Record<string, any> = {}) {
    userCounter++
    return {
        name: `Test User ${userCounter}`,
        email: `testuser${userCounter}@example.com`,
        password: "password123",
        ...overrides,
    }
}


// ── Category Test Data ───────────────────────────────────────────────────────

let categoryCounter = 0

export function createCategoryData(overrides: Record<string, any> = {}) {
    categoryCounter++
    return {
        name: `Category ${categoryCounter}`,
        slug: `category-${categoryCounter}`,
        description: `Description for category ${categoryCounter}`,
        ...overrides,
    }
}

// ── Article Test Data ────────────────────────────────────────────────────────

let articleCounter = 0

export function createArticleData(overrides: Record<string, any> = {}) {
    articleCounter++
    return {
        title: `Test Article ${articleCounter}`,
        content: `<p>Content for test article ${articleCounter}</p>`,
        status: "draft",
        ...overrides,
    }
}

// ── Response Assertions ─────────────────────────────────────────────────────

export function expectSuccess(body: any, statusCode: number = 200) {
    if (body.success !== true) {
        throw new Error(`Expected success=true, got: ${JSON.stringify(body)}`)
    }
    if (body.statusCode !== statusCode) {
        throw new Error(`Expected statusCode=${statusCode}, got: ${body.statusCode}`)
    }
}

export function expectError(body: any, statusCode: number) {
    if (body.success !== false) {
        throw new Error(`Expected success=false, got: ${JSON.stringify(body)}`)
    }
    if (body.statusCode !== statusCode) {
        throw new Error(`Expected statusCode=${statusCode}, got: ${body.statusCode}`)
    }
}

export function expectPagination(body: any) {
    if (!body.meta) {
        throw new Error(`Expected meta pagination, got: ${JSON.stringify(body)}`)
    }
    const requiredFields = ["total", "perPage", "currentPage", "lastPage", "from", "to"]
    for (const field of requiredFields) {
        if (body.meta[field] === undefined) {
            throw new Error(`Missing pagination field: ${field}`)
        }
    }
}

// ── Reset Counters ──────────────────────────────────────────────────────────

export function resetCounters() {
    userCounter = 0
    categoryCounter = 0
    articleCounter = 0
}
