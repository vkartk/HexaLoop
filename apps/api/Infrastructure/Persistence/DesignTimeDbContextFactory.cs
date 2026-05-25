using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace HexaLoop.Api.Infrastructure.Persistence;

public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connection = Environment.GetEnvironmentVariable("HEXALOOP_CONNECTION_STRING")
            ?? "Host=localhost;Port=5432;Database=hexaloop;Username=hexaloop;Password=hexaloop";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connection)
            .Options;

        return new AppDbContext(options);
    }
}
