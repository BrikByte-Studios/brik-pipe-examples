using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace BrikByte.DotNetApiExample.Tests.Smoke
{
    /// <summary>
    /// Container-focused smoke tests.
    /// These are designed to be run from the BrikPipe integration runner
    /// against the real app container at APP_BASE_URL (e.g. http://app:8080).
    /// </summary>
    public class ApiSmokeTests
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        private static string GetBaseUrl()
        {
            var fromEnv = Environment.GetEnvironmentVariable("APP_BASE_URL");
            return string.IsNullOrWhiteSpace(fromEnv)
                ? "http://localhost:8080"   // local fallback
                : fromEnv;
        }

        private static HttpClient CreateClient()
        {
            return new HttpClient
            {
                BaseAddress = new Uri(GetBaseUrl()),
                Timeout = TimeSpan.FromSeconds(5)
            };
        }

        // -----------------------------
        // /health smoke
        // -----------------------------
        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Category", "Smoke")]
        public async Task HealthEndpoint_ShouldReturn2xx()
        {
            using var client = CreateClient();

            var response = await client.GetAsync("/health");
            var body = await response.Content.ReadAsStringAsync();

            var statusCode = (int)response.StatusCode;
            Assert.True(statusCode >= 200 && statusCode < 300,
                $"[SMOKE] Expected 2xx status from /health, got {statusCode}. Body: {body}");
        }

        // Small DTO for deserializing payment response
        private sealed record PaymentResponse(string? Status, string? TransactionId);

        // -----------------------------
        // /payments smoke
        // -----------------------------
        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Category", "Smoke")]
        public async Task PaymentsEndpoint_ShouldReturnApprovedTransaction()
        {
            using var client = CreateClient();

            var payload = new
            {
                amount = 100,
                currency = "ZAR",
                source  = "smoke-test"
            };

            var json = JsonSerializer.Serialize(payload);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/payments", content);
            var body = await response.Content.ReadAsStringAsync();

            var statusCode = (int)response.StatusCode;
            Assert.True(statusCode >= 200 && statusCode < 300,
                $"[SMOKE] Expected 2xx status from /payments, got {statusCode}. Body: {body}");

            var parsed = JsonSerializer.Deserialize<PaymentResponse>(body, JsonOptions);
            Assert.NotNull(parsed);

            Assert.Equal("approved", parsed!.Status);
            Assert.False(string.IsNullOrWhiteSpace(parsed.TransactionId),
                $"[SMOKE] Expected non-empty transactionId. Body: {body}");
        }
    }
}
