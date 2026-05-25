using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using HexaLoop.Api.Tests.Infra;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using YamlDotNet.Serialization;

namespace HexaLoop.Api.Tests;

/// Diffs the emitted /openapi/v1.json against the committed contract YAML.
/// CI fails on drift — that's the whole guarantee of §2 of the architecture contract.
public sealed class ContractDriftTests : IClassFixture<HexaLoopWebApplicationFactory>
{
    private readonly HexaLoopWebApplicationFactory _factory;

    public ContractDriftTests(HexaLoopWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Emitted_spec_covers_every_path_and_method_in_the_committed_contract()
    {
        var contractPaths = LoadContractPaths();

        var client = _factory.CreateClient();
        var emitted = await client.GetFromJsonAsync<JsonElement>("/openapi/v1.json");
        var emittedPaths = ExtractPaths(emitted, prefix: "/api/v1");

        var missing = contractPaths
            .Where(p => !emittedPaths.Contains(p))
            .OrderBy(p => p)
            .ToList();

        missing.Should().BeEmpty(
            "every (method + path) frozen in packages/contract/openapi.yaml must be served by the API. " +
            "If a frozen shape is genuinely unworkable server-side, edit openapi.yaml and note it in CONTRACT_CHANGES.md.");
    }

    private static HashSet<string> LoadContractPaths()
    {
        var contractYaml = File.ReadAllText("openapi.yaml");
        var deserializer = new DeserializerBuilder().Build();
        var root = deserializer.Deserialize<Dictionary<object, object>>(contractYaml);
        var paths = (Dictionary<object, object>)root["paths"];

        var set = new HashSet<string>();
        foreach (var (rawPath, rawValue) in paths)
        {
            var pathStr = (string)rawPath;
            var methods = (Dictionary<object, object>)rawValue!;
            foreach (var (rawMethod, _) in methods)
            {
                var m = ((string)rawMethod).ToUpperInvariant();
                if (m is "GET" or "POST" or "PUT" or "DELETE" or "PATCH")
                {
                    set.Add($"{m} {pathStr}");
                }
            }
        }
        return set;
    }

    private static HashSet<string> ExtractPaths(JsonElement document, string prefix)
    {
        var set = new HashSet<string>();
        if (!document.TryGetProperty("paths", out var paths)) return set;

        foreach (var path in paths.EnumerateObject())
        {
            var raw = path.Name;
            if (!raw.StartsWith(prefix)) continue;
            var normalized = raw[prefix.Length..];

            foreach (var op in path.Value.EnumerateObject())
            {
                var method = op.Name.ToUpperInvariant();
                if (method is "GET" or "POST" or "PUT" or "DELETE" or "PATCH")
                {
                    set.Add($"{method} {normalized}");
                }
            }
        }
        return set;
    }
}
