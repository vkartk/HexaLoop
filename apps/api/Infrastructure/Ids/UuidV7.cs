namespace HexaLoop.Api.Infrastructure.Ids;

public static class UuidV7
{
    public static Guid New() => Guid.CreateVersion7();

    public static Guid NewAt(DateTimeOffset timestamp) => Guid.CreateVersion7(timestamp);
}
