using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace HexaLoop.Api.Infrastructure.Auth;

public static class AuthRegistration
{
    public static IServiceCollection AddHexaLoopAuth(this IServiceCollection services, IConfiguration config)
    {
        var section = config.GetSection(JwtSettings.SectionName);
        services.Configure<JwtSettings>(section);
        var settings = section.Get<JwtSettings>() ?? new JwtSettings();

        if (string.IsNullOrWhiteSpace(settings.SigningKey) || settings.SigningKey.Length < 32)
        {
            throw new InvalidOperationException(
                "Jwt:SigningKey must be at least 32 characters. Set it in configuration or via HEXALOOP_JWT_SIGNINGKEY env var.");
        }

        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddSingleton<IPasswordHashService, PasswordHashService>();
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = false;
                options.SaveToken = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = settings.Issuer,
                    ValidAudience = settings.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.SigningKey)),
                    ClockSkew = TimeSpan.FromSeconds(15),
                };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy("Admin", p => p.RequireRole("Admin"));
            options.AddPolicy("Maverick", p => p.RequireRole("Maverick"));
            options.AddPolicy("Supervisor", p => p.RequireRole("Supervisor"));
        });

        return services;
    }
}
