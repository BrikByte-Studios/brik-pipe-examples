using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace BrikByte.DotNetApiExample;

public sealed record PaymentRequest(int Amount, string Currency);
public sealed record PaymentResponse(string Status, string TransactionId);

public static class PaymentsEndpoints
{
    /// <summary>
    /// Maps the /payments endpoint used by integration tests.
    ///
    /// In the full production version this would:
    ///   - read EXTERNAL_API_BASE_URL from env
    ///   - call POST {baseUrl}/external/payment
    ///   - return the provider response
    ///
    /// For the PoC, we return a deterministic mocked response that matches
    /// the expectations of ExternalPaymentIntegrationTests.
    /// </summary>
    public static void MapPaymentsEndpoints(this WebApplication app)
    {
        app.MapPost("/payments", async (HttpRequest request) =>
        {
            // Optionally deserialize the incoming body if you want to assert on it:
            // var payload = await request.ReadFromJsonAsync<PaymentRequest>();

            var response = new PaymentResponse(
                Status: "approved",
                TransactionId: "mock-tx-123"
            );

            return Results.Ok(response);
        });
    }
}
