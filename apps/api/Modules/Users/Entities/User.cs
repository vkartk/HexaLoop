namespace HexaLoop.Api.Modules.Users.Entities;

public enum UserRole
{
    Admin,
    Maverick,
    Supervisor,
}

public sealed class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string? EmployeeCode { get; set; }
    public Guid? ManagerId { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }

    public User? Manager { get; set; }
    public ICollection<User> Reports { get; set; } = new List<User>();
}
