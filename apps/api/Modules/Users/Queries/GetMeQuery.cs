using MediatR;
using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Auth;
using HexaLoop.Api.Infrastructure.Errors;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Modules.Users.Contracts;

namespace HexaLoop.Api.Modules.Users.Queries;

public sealed record GetMeQuery : IRequest<UserDto>;

public sealed class GetMeQueryHandler(AppDbContext db, ICurrentUser current)
    : IRequestHandler<GetMeQuery, UserDto>
{
    public async Task<UserDto> Handle(GetMeQuery request, CancellationToken ct)
    {
        var id = current.RequireId();
        var user = await db.Users.SingleOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new NotFoundException("User", id);
        return UserDto.From(user);
    }
}
