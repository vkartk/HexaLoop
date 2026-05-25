using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Modules.Users.Contracts;

public sealed record UserDto(
    Guid Id,
    string Email,
    string FullName,
    UserRole Role,
    string? EmployeeCode,
    Guid? ManagerId,
    bool IsActive)
{
    public static UserDto From(User u) =>
        new(u.Id, u.Email, u.FullName, u.Role, u.EmployeeCode, u.ManagerId, u.IsActive);
}
