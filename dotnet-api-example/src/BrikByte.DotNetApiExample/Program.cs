using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

/// <summary>
/// Entry point for the minimal .NET API example used by BrikByteOS CI templates.
/// Exposes:
///   - GET /health → { "status": "ok", "service": "dotnet-api-example" }
/// </summary>
var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

// Simple health endpoint for CI smoke tests.
app.MapGet("/health", (ILoggerFactory loggerFactory) =>
{
    var logger = loggerFactory.CreateLogger("HealthEndpoint");
    logger.LogInformation("Health endpoint invoked.");

    return Results.Ok(new
    {
        status = "ok",
        service = "dotnet-api-example"
    });
});

app.Run();

/// <summary>
/// Partial Program class to allow WebApplicationFactory&lt;Program&gt; to discover
/// the entry point in integration tests.
/// </summary>
public partial class Program { }
