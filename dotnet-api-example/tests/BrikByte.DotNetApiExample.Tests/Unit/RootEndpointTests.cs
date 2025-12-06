using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace BrikByte.DotNetApiExample.Tests.Unit
{
    /// <summary>
    /// Unit-style tests for the root ("/") endpoint of the minimal API.
    /// Uses WebApplicationFactory to host the app in-process,
    /// so no external APP_BASE_URL or container is required.
    /// </summary>
    public class RootEndpointTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public RootEndpointTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task Root_ReturnsOk_WithExpectedMessage()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/");

            // Assert: HTTP status
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            // Assert: Content-Type
            Assert.Equal("application/json; charset=utf-8",
                response.Content.Headers.ContentType?.ToString());

            // Assert: JSON body
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("message", out var messageProp),
                "Response JSON should contain a 'message' property.");

            var message = messageProp.GetString();
            Assert.Equal("DotNet API Example — BrikByteOS pipelines OK", message);
        }
    }
}
