using System;
using System.Threading.Tasks;
using Npgsql;
using Xunit;

namespace DotNetApiExample.IntegrationTests
{
    /// <summary>
    /// PIPE-INTEG-FIXTURES-CONFIG-002
    /// --------------------------------
    /// Sanity check that DB fixtures were applied before integration tests run.
    ///
    /// Assumes:
    ///   - Postgres is reachable using the standard BrikPipe env vars:
    ///       DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
    ///   - SQL fixtures created a "payments" table with at least 1 row.
    /// </summary>
    [Trait("Category", "Integration")]
    public class DbFixturesTests
    {
        [Fact]
        public async Task PaymentsTable_ShouldContainSeededRows()
        {
            var host = GetEnvOrDefault("DB_HOST", "db");
            var port = GetEnvOrDefault("DB_PORT", "5432");
            var user = GetEnvOrDefault("DB_USER", "testuser");
            var password = GetEnvOrDefault("DB_PASSWORD", "testpass");
            var dbName = GetEnvOrDefault("DB_NAME", "testdb");

            var connectionString =
                $"Host={host};Port={port};Username={user};Password={password};Database={dbName};SslMode=Disable";

            await using var conn = new NpgsqlConnection(connectionString);

            try
            {
                await conn.OpenAsync();
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException(
                    $"Failed to open Postgres connection ({host}:{port}/{dbName})", ex);
            }

            await using var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM payments;", conn);

            var result = await cmd.ExecuteScalarAsync();
            if (result is not long count)
            {
                throw new InvalidOperationException(
                    $"Unexpected scalar result for COUNT(*): {result ?? "null"}");
            }

            Assert.True(count > 0,
                $"Expected at least 1 seeded row in 'payments' table, but got {count}.");
        }

        private static string GetEnvOrDefault(string key, string fallback)
        {
            var value = Environment.GetEnvironmentVariable(key);
            return string.IsNullOrWhiteSpace(value) ? fallback : value;
        }
    }
}
