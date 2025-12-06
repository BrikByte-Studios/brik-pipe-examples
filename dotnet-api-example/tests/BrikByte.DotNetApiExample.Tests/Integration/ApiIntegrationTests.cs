using System;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace BrikByte.DotNetApiExample.Tests.Integration
{
    // Matches the JSON payload returned by GET /
    // e.g. { "message": "DotNet API Example — BrikByteOS pipelines OK" }
    public sealed class RootResponse
    {
        public string? Message { get; set; }
    }

    // Matches the JSON payload returned by GET /health
    // e.g. { "status": "ok" }
    public sealed class HealthResponse
    {
        public string? Status { get; set; }
    }

    public class ApiIntegrationTests
    {
        private static string GetBaseUrl()
        {
            // In BrikPipe integration runs this will be set to:
            //   http://app:8080
            // For local dev you can just run the API on 8080 and it will fall back.
            var fromEnv = Environment.GetEnvironmentVariable("APP_BASE_URL");
            return string.IsNullOrWhiteSpace(fromEnv)
                ? "http://localhost:8080"
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

        [Fact]
        [Trait("Category", "Integration")]
        public async Task RootEndpoint_ReturnsOkJson()
        {
            using var client = CreateClient();

            // GET /
            var response = await client.GetAsync("/");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            await using var stream = await response.Content.ReadAsStreamAsync();
            var payload = await JsonSerializer.DeserializeAsync<RootResponse>(
                stream,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

            Assert.NotNull(payload);
            Assert.False(string.IsNullOrWhiteSpace(payload!.Message));
            // Optional: loosened assertion so it won't break if the exact message changes.
            // Assert.Contains("BrikByteOS", payload.Message);
        }

        [Fact]
        [Trait("Category", "Integration")]
        public async Task HealthEndpoint_ReturnsStatusOk()
        {
            using var client = CreateClient();

            // GET /health
            var response = await client.GetAsync("/health");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            await using var stream = await response.Content.ReadAsStreamAsync();
            var payload = await JsonSerializer.DeserializeAsync<HealthResponse>(
                stream,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

            Assert.NotNull(payload);
            Assert.Equal("ok", payload!.Status);
        }
    }
}
