using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace BrikByte.DotNetApiExample.Controllers
{
    public sealed class PaymentRequest
    {
        public int Amount { get; set; }
        public string Currency { get; set; } = "ZAR";
    }

    public sealed class ExternalPaymentResponse
    {
        public string Status { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;
    }

    /// <summary>
    /// /payments endpoint
    ///
    /// - Reads EXTERNAL_API_BASE_URL from configuration/env.
    /// - Calls POST {EXTERNAL_API_BASE_URL}/external/payment.
    /// - Returns 200 OK with { status, transactionId }.
    ///
    /// Used by:
    ///   - PIPE-INTEG-FIXTURES-CONFIG-002 external provider tests
    /// </summary>
    [ApiController]
    [Route("[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _externalBaseUrl;

        public PaymentsController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _externalBaseUrl =
                configuration["EXTERNAL_API_BASE_URL"]
                ?? Environment.GetEnvironmentVariable("EXTERNAL_API_BASE_URL")
                ?? "https://api.example.com";
        }

        [HttpPost]
        public async Task<IActionResult> CreatePayment([FromBody] PaymentRequest request)
        {
            var client = _httpClientFactory.CreateClient("ExternalPayments");

            var url = $"{_externalBaseUrl.TrimEnd('/')}/external/payment";

            var httpResponse = await client.PostAsJsonAsync(url, request);

            // If the external provider fails, surface it as 502 for clarity.
            if (!httpResponse.IsSuccessStatusCode)
            {
                return StatusCode(502, new
                {
                    status = "error",
                    reason = $"External provider returned {httpResponse.StatusCode}"
                });
            }

            var ext = await httpResponse.Content.ReadFromJsonAsync<ExternalPaymentResponse>();

            if (ext is null)
            {
                return StatusCode(502, new
                {
                    status = "error",
                    reason = "External provider returned an invalid response"
                });
            }

            // Shape the response the same way your integration test expects.
            return Ok(new
            {
                status = ext.Status,
                transactionId = ext.TransactionId
            });
        }
    }
}
