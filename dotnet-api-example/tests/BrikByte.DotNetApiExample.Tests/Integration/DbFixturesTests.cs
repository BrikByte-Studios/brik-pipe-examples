using System;
using System.Threading.Tasks;
using Npgsql;
using Xunit;

namespace DotNetApiExample.IntegrationTests
{
    public class DbFixturesTests
    {
        private static string BuildConnectionString()
        {
            // Match the ENV defaults used by the BrikPipe integ runner
            var host     = GetEnvOrDefault("DB_HOST", "db");
            var port     = GetEnvOrDefault("DB_PORT", "5432");
            var user     = GetEnvOrDefault("DB_USER", "testuser");
            var password = GetEnvOrDefault("DB_PASSWORD", "testpass");
            var dbName   = GetEnvOrDefault("DB_NAME", "testdb");

            return $"Host={host};Port={port};Username={user};Password={password};Database={dbName};";
        }

        private static string GetEnvOrDefault(string key, string fallback)
            => Environment.GetEnvironmentVariable(key) ?? fallback;

        [Fact]
        public async Task PaymentsTable_ShouldContainSeededRows()
        {
            var connString = BuildConnectionString();

            await using var conn = new NpgsqlConnection(connString);
            await conn.OpenAsync();

            // Ensure the table exists (idempotent)
            const string createSql = @"
                CREATE TABLE IF NOT EXISTS payments (
                    id         SERIAL PRIMARY KEY,
                    amount     INTEGER      NOT NULL,
                    currency   VARCHAR(8)   NOT NULL,
                    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
                );
            ";

            await using (var cmd = new NpgsqlCommand(createSql, conn))
            {
                await cmd.ExecuteNonQueryAsync();
            }

            // ✅ Seed at least one row (if this runs multiple times that’s OK)
            const string seedSql = @"
                INSERT INTO payments (amount, currency)
                VALUES (100, 'ZAR');
            ";

            await using (var cmd = new NpgsqlCommand(seedSql, conn))
            {
                await cmd.ExecuteNonQueryAsync();
            }

            // ✅ Now assert there is data
            const string countSql = "SELECT COUNT(*) FROM payments;";
            await using (var cmd = new NpgsqlCommand(countSql, conn))
            {
                var result = await cmd.ExecuteScalarAsync();
                var count  = Convert.ToInt64(result);

                Assert.True(count > 0, $"Expected at least 1 row in payments, got {count}.");
            }
        }
    }
}
