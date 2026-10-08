import { describe, test, expect } from "bun:test"
import { renderForgotPasswordEmail } from "../src/core/templates/email"

describe("Email Templates - Forgot Password", () => {
    test("should render HTML and plain text with provided variables in English", () => {
        const { html, text } = renderForgotPasswordEmail({
            name: "John Doe",
            resetLink: "https://example.com/auth/reset-password?email=john@example.com&token=abc123xyz",
            expiresInHours: 10,
        })

        // Check HTML content
        expect(html).toContain("John Doe")
        expect(html).toContain("https://example.com/auth/reset-password?email=john@example.com&amp;token=abc123xyz")
        expect(html).toContain("10 hours")
        expect(html).toContain("Reset Password")
        expect(html).toContain("#2D4E6F")
        expect(html).toContain("Asset Monitoring Teknologi Indonesia")
        expect(html).toContain("<!DOCTYPE html>")
        expect(html).toContain("<table")
        // Title on top should be removed
        expect(html).not.toContain("<h2")

        // Check Text fallback
        expect(text).toContain("Hello John Doe,")
        expect(text).toContain("https://example.com/auth/reset-password?email=john@example.com&token=abc123xyz")
        expect(text).toContain("10 hours")
        expect(text).toContain("Asset Monitoring Teknologi Indonesia")
    })

    test("should escape malicious HTML in user input", () => {
        const { html } = renderForgotPasswordEmail({
            name: "<script>alert('xss')</script>",
            resetLink: "https://example.com/reset",
        })

        expect(html).not.toContain("<script>")
        expect(html).toContain("&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;")
    })

    test("should use fallbacks when optional parameters are omitted", () => {
        const { html, text } = renderForgotPasswordEmail({
            name: "",
            resetLink: "https://example.com/reset",
        })

        expect(html).toContain("User")
        expect(html).toContain("10 hours")
        expect(html).toContain("Asset Monitoring Teknologi Indonesia")

        expect(text).toContain("User")
        expect(text).toContain("10 hours")
        expect(text).toContain("Asset Monitoring Teknologi Indonesia")
    })
})
