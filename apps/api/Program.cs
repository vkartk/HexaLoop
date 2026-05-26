using System.Text.Json;
using System.Text.Json.Serialization;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Serilog;
using HexaLoop.Api.Background;
using HexaLoop.Api.Infrastructure.Auth;
using HexaLoop.Api.Infrastructure.Email;
using HexaLoop.Api.Infrastructure.Errors;
using HexaLoop.Api.Infrastructure.Gdpr;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Infrastructure.Time;
using HexaLoop.Api.Infrastructure.Validation;
using HexaLoop.Api.Modules.Ai;
using HexaLoop.Api.Modules.Ai.Services;
using HexaLoop.Api.Modules.Analytics;
using HexaLoop.Api.Modules.Audit;
using HexaLoop.Api.Modules.Cycles;
using HexaLoop.Api.Modules.Effectiveness;
using HexaLoop.Api.Modules.Feedback;
using HexaLoop.Api.Modules.Notifications;
using HexaLoop.Api.Modules.People;
using HexaLoop.Api.Modules.Trainers;
using HexaLoop.Api.Modules.Users;

Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((ctx, services, cfg) => cfg
        .ReadFrom.Configuration(ctx.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console());

    // --- DB ---
    var connection = builder.Configuration.GetConnectionString("Default")
        ?? Environment.GetEnvironmentVariable("HEXALOOP_CONNECTION_STRING")
        ?? throw new InvalidOperationException("ConnectionStrings:Default not configured.");
    builder.Services.AddDbContext<AppDbContext>(opt => opt.UseNpgsql(connection));

    // --- Cross-cutting ---
    builder.Services.AddSingleton<IClock, SystemClock>();
    builder.Services.AddHexaLoopAuth(builder.Configuration);
    builder.Services.AddDomainProblemDetails();

    // --- MediatR + FluentValidation ---
    builder.Services.AddMediatR(cfg =>
    {
        cfg.RegisterServicesFromAssemblyContaining<Program>();
        cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
    });
    builder.Services.AddValidatorsFromAssemblyContaining<Program>(includeInternalTypes: true);

    // --- Module services ---
    builder.Services.AddScoped<IAuditWriter, AuditWriter>();

    // The AI seam — swap StubAiService for HttpAiService in Phase 2; no other changes.
    builder.Services.AddSingleton<IAiService, StubAiService>();
    builder.Services.AddScoped<IInsightCacheService, InsightCacheService>();

    // Email + background workers
    builder.Services.Configure<SmtpSettings>(builder.Configuration.GetSection(SmtpSettings.SectionName));
    builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();
    builder.Services.AddHostedService<CycleAutomationWorker>();
    builder.Services.AddHostedService<ReminderWorker>();
    builder.Services.AddHostedService<NotificationDispatchWorker>();

    // --- Seeder ---
    builder.Services.AddScoped<Seeder>();

    // --- JSON ---
    builder.Services.Configure<JsonOptions>(o =>
    {
        o.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        o.SerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
        o.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.Never;
        // Most enums in the frozen contract are PascalCase (Admin, MaverickPostTraining, ...).
        // The two lowercase-token cases (severity, trend.direction) are projected to plain strings in their DTOs.
        o.SerializerOptions.Converters.Add(new JsonStringEnumConverter(namingPolicy: null, allowIntegerValues: false));
    });

    // --- OpenAPI + CORS ---
    builder.Services.AddOpenApi();
    builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
        .WithOrigins("http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));

    var app = builder.Build();

    app.UseSerilogRequestLogging();
    app.UseExceptionHandler();
    app.UseStatusCodePages();
    app.UseCors();
    app.UseAuthentication();
    app.UseAuthorization();
    app.UseMiddleware<PersonalDataAccessLogger>();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.MapScalarApiReference();

        await using var scope = app.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
        var seeder = scope.ServiceProvider.GetRequiredService<Seeder>();
        await seeder.RunAsync();
    }

    var api = app.MapGroup("/api/v1");
    api.MapGet("/health", () => Results.Ok(new { status = "ok" })).AllowAnonymous();

    api.MapAuthEndpoints();
    api.MapDashboardEndpoints();
    api.MapFeedbackEndpoints();
    api.MapNotificationEndpoints();
    api.MapCycleEndpoints();
    api.MapEffectivenessEndpoints();
    api.MapChatEndpoints();
    api.MapReportEndpoints();
    api.MapTrainerEndpoints();
    api.MapPeopleEndpoints();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Host terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

public partial class Program;
