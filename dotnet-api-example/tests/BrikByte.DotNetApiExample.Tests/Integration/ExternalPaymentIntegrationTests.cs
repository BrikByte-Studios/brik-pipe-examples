using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Xunit;

namespace BrikByte.DotNetApiExample.Tests.Integration
{
    /// <summary>
    /// PIPE-INTEG-FIXTURES-CONFIG-002
    /// --------------------------------
    /// Contract-style integration test that verifies the .NET service
    /// exposes a /payments endpoint which returns a deterministic
    /// "approved" payment response.
    ///
    /// Flow:
    ///   - Test calls APP_BASE_URL/payments
    ///   - Service returns JSON:
    ///       { "status": "approved", "transactionId": "mock-tx-123" }
    ///
    /// This is executed by the BrikPipe integration test runner inside
    /// the tests container, talking to the running app container.
    /// </summary>
    [Trait("Category", "Integration")]
    [Trait("IntegItem", "payments::approved")]
    public class ExternalPaymentIntegrationTests : IDisposable
    {
        private readonly HttpClient _httpClient;

        public ExternalPaymentIntegrationTests()
        {
            var appBaseUrl = GetEnvOrDefault("APP_BASE_URL", "http://localhost:8080");
            _httpClient = new HttpClient { BaseAddress = new Uri(appBaseUrl) };
        }

        [Fact]
        public async Task PaymentsEndpoint_ReturnsApprovedTransaction()
        {
            // Arrange
            var request = new PaymentRequest
            {
                Amount = 100,
                Currency = "ZAR"
            };

            // Act
            var response = await _httpClient.PostAsJsonAsync("/payments", request);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<PaymentResponse>();
            Assert.NotNull(body);
            Assert.Equal("approved", body!.Status);
            Assert.Equal("mock-tx-123", body.TransactionId);
        }

        public void Dispose()
        {
            _httpClient.Dispose();
        }

        private static string GetEnvOrDefault(string key, string fallback)
        {
            var value = Environment.GetEnvironmentVariable(key);
            return string.IsNullOrWhiteSpace(value) ? fallback : value;
        }

        private sealed class PaymentRequest
        {
            public int Amount { get; set; }
            public string Currency { get; set; } = "ZAR";
        }

        private sealed class PaymentResponse
        {
            public string Status { get; set; } = string.Empty;
            public string TransactionId { get; set; } = string.Empty;
        }
    }
}
