using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

/// <summary>
/// Entry point for the minimal .NET API example used by BrikByteOS CI templates.
/// Exposes:
///   - GET /       → { "message": "DotNet API Example — BrikByteOS pipelines OK" }
///   - GET /health → { "status": "ok", "service": "dotnet-api-example" }
/// </summary>
var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();


// ------------------------------------------------------------
// ROOT ENDPOINT  → used for cross-stack parity validation
// ------------------------------------------------------------
app.MapGet("/", (ILoggerFactory loggerFactory) =>
{
    var logger = loggerFactory.CreateLogger("RootEndpoint");
    logger.LogInformation("Root endpoint invoked.");

    return Results.Ok(new
    {
        message = "DotNet API Example — BrikByteOS pipelines OK"
    });
});


// ------------------------------------------------------------
// HEALTH ENDPOINT → required for BrikPipe readiness checks
// ------------------------------------------------------------
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
/// Partial Program class required so WebApplicationFactory&lt;Program&gt;
/// can locate the entry point during Integration Tests.
/// </summary>
public partial class Program { }
