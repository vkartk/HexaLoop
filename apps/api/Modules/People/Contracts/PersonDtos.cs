using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Modules.People.Contracts;

public enum PersonStatus
{
    Active,
    Inactive,
}

public sealed record PersonRow(
    Guid Id,
    string FullName,
    string Email,
    UserRole Role,
    PersonStatus Status,
    string? EmployeeCode,
    Guid? ManagerId,
    string? ManagerName,
    DateTimeOffset? LastActiveAt);

public sealed record PeoplePage(
    IReadOnlyList<PersonRow> Data,
    int Page,
    int PageSize,
    int Total);
