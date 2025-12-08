using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using WireMock.Server;
using Xunit;

namespace BrikByte.DotNetApiExample.Tests.Integration
{
    /// <summary>
    /// PIPE-INTEG-FIXTURES-CONFIG-002
    /// --------------------------------
    /// Verifies that the .NET service calls a mocked external provider
    /// (EXTERNAL_API_BASE_URL) rather than a real external API.
    ///
    /// Flow:
    ///   - WireMock server stubs POST /external/payment
    ///   - Test sets EXTERNAL_API_BASE_URL to WireMock base URL
    ///   - Test calls APP_BASE_URL/payments
    ///   - Service should call external provider and return approved transaction
    /// </summary>
    public class ExternalPaymentIntegrationTests : IDisposable
    {
        private readonly WireMockServer _mockServer;
        private readonly HttpClient _httpClient;
        private readonly string _appBaseUrl;

        public ExternalPaymentIntegrationTests()
        {
            // 1) Start in-process HTTP mock server
            _mockServer = WireMockServer.Start();

            var baseUrl = _mockServer.Urls[0];
            Console.WriteLine($"[MOCK] External API base URL: {baseUrl}");

            // 2) Configure stub: POST /external/payment
            _mockServer
                .Given(
                    Request.Create()
                           .WithPath("/external/payment")
                           .UsingPost()
                )
                .RespondWith(
                    Response.Create()
                            .WithStatusCode(HttpStatusCode.OK)
                            .WithHeader("Content-Type", "application/json")
                            .WithBody(@"{ ""status"": ""approved"", ""transactionId"": ""mock-tx-123"" }")
                );

            // 3) Point the app to the mocked external provider
            Environment.SetEnvironmentVariable("EXTERNAL_API_BASE_URL", baseUrl);

            // 4) HTTP client to hit the running service container
            _appBaseUrl = GetEnvOrDefault("APP_BASE_URL", "http://localhost:8080");
            _httpClient = new HttpClient { BaseAddress = new Uri(_appBaseUrl) };
        }

        [Fact]
        public async Task PaymentsEndpoint_UsesMockedExternalProvider()
        {
            var request = new PaymentRequest
            {
                Amount = 100,
                Currency = "ZAR"
            };

            // Call the running service’s /payments endpoint
            var response = await _httpClient.PostAsJsonAsync("/payments", request);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var body = await response.Content.ReadFromJsonAsync<PaymentResponse>();
            Assert.NotNull(body);
            Assert.Equal("approved", body!.Status);
            Assert.Equal("mock-tx-123", body.TransactionId);

            // Optional: verify WireMock actually saw traffic (no FluentAssertions)
            var logs = _mockServer.LogEntries;
            Assert.NotNull(logs);
            Assert.True(
                logs.Any(),
                "Expected WireMock to receive at least one request to /external/payment."
            );
        }

        public void Dispose()
        {
            _httpClient.Dispose();
            _mockServer.Stop();
            _mockServer.Dispose();
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
