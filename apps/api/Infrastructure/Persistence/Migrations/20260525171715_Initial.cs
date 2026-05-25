using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HexaLoop.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "courses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TrainerType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Domain = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Objectives = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    DurationHours = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_courses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "trainers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Organization = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    DomainExpertise = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    EngagementType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_trainers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    FullName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    EmployeeCode = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    ManagerId = table.Column<Guid>(type: "uuid", nullable: true),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_users_users_ManagerId",
                        column: x => x.ManagerId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "sessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CourseId = table.Column<Guid>(type: "uuid", nullable: false),
                    TrainerId = table.Column<Guid>(type: "uuid", nullable: false),
                    StartDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    VirtualLink = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Capacity = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_sessions_courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_sessions_trainers_TrainerId",
                        column: x => x.TrainerId,
                        principalTable: "trainers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "audit_logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ActorId = table.Column<Guid>(type: "uuid", nullable: false),
                    Action = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    EntityType = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    EntityId = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    MetadataJson = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_logs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_audit_logs_users_ActorId",
                        column: x => x.ActorId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "refresh_tokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TokenHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    RevokedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_refresh_tokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_refresh_tokens_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "enrollments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    MaverickId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_enrollments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_enrollments_sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_enrollments_users_MaverickId",
                        column: x => x.MaverickId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "feedback_cycles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Threshold = table.Column<double>(type: "double precision", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    OpensAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ClosesAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    TriggerBasis = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    ClosedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ClosedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    OverrideReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_feedback_cycles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_feedback_cycles_sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_feedback_cycles_users_ClosedByUserId",
                        column: x => x.ClosedByUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ai_insights",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CycleId = table.Column<Guid>(type: "uuid", nullable: false),
                    SentimentPositive = table.Column<double>(type: "double precision", nullable: false),
                    SentimentNeutral = table.Column<double>(type: "double precision", nullable: false),
                    SentimentNegative = table.Column<double>(type: "double precision", nullable: false),
                    TopThemes = table.Column<string>(type: "jsonb", nullable: false),
                    Summary = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    Recommendations = table.Column<string>(type: "jsonb", nullable: false),
                    SourceCount = table.Column<int>(type: "integer", nullable: false),
                    GeneratedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IsApproved = table.Column<bool>(type: "boolean", nullable: false),
                    Degraded = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_insights", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ai_insights_feedback_cycles_CycleId",
                        column: x => x.CycleId,
                        principalTable: "feedback_cycles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "effectiveness_responses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CycleId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupervisorId = table.Column<Guid>(type: "uuid", nullable: false),
                    MaverickId = table.Column<Guid>(type: "uuid", nullable: false),
                    TechnicalCompetency = table.Column<int>(type: "integer", nullable: true),
                    SoftSkills = table.Column<int>(type: "integer", nullable: true),
                    ProjectPerformance = table.Column<int>(type: "integer", nullable: true),
                    OverallReadiness = table.Column<int>(type: "integer", nullable: true),
                    Comments = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    FutureTrainingRecommendations = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SubmittedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_effectiveness_responses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_effectiveness_responses_feedback_cycles_CycleId",
                        column: x => x.CycleId,
                        principalTable: "feedback_cycles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_effectiveness_responses_users_MaverickId",
                        column: x => x.MaverickId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_effectiveness_responses_users_SupervisorId",
                        column: x => x.SupervisorId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "feedback_responses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CycleId = table.Column<Guid>(type: "uuid", nullable: false),
                    MaverickId = table.Column<Guid>(type: "uuid", nullable: false),
                    OverallRating = table.Column<int>(type: "integer", nullable: true),
                    Highlights = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Improvements = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SubmittedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_feedback_responses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_feedback_responses_feedback_cycles_CycleId",
                        column: x => x.CycleId,
                        principalTable: "feedback_cycles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_feedback_responses_users_MaverickId",
                        column: x => x.MaverickId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "notifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Channel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Subject = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Body = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Severity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    RelatedCycleId = table.Column<Guid>(type: "uuid", nullable: true),
                    Href = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    SentAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ReadAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_notifications_feedback_cycles_RelatedCycleId",
                        column: x => x.RelatedCycleId,
                        principalTable: "feedback_cycles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_notifications_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ai_insights_CycleId",
                table: "ai_insights",
                column: "CycleId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_ActorId",
                table: "audit_logs",
                column: "ActorId");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_CreatedAt",
                table: "audit_logs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_EntityType_EntityId",
                table: "audit_logs",
                columns: new[] { "EntityType", "EntityId" });

            migrationBuilder.CreateIndex(
                name: "IX_courses_Code",
                table: "courses",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_effectiveness_responses_CycleId_SupervisorId_MaverickId",
                table: "effectiveness_responses",
                columns: new[] { "CycleId", "SupervisorId", "MaverickId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_effectiveness_responses_MaverickId",
                table: "effectiveness_responses",
                column: "MaverickId");

            migrationBuilder.CreateIndex(
                name: "IX_effectiveness_responses_SupervisorId",
                table: "effectiveness_responses",
                column: "SupervisorId");

            migrationBuilder.CreateIndex(
                name: "IX_enrollments_MaverickId",
                table: "enrollments",
                column: "MaverickId");

            migrationBuilder.CreateIndex(
                name: "IX_enrollments_SessionId_MaverickId",
                table: "enrollments",
                columns: new[] { "SessionId", "MaverickId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_feedback_cycles_ClosedByUserId",
                table: "feedback_cycles",
                column: "ClosedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_feedback_cycles_SessionId_Type",
                table: "feedback_cycles",
                columns: new[] { "SessionId", "Type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_feedback_cycles_Status",
                table: "feedback_cycles",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_feedback_responses_CycleId_MaverickId",
                table: "feedback_responses",
                columns: new[] { "CycleId", "MaverickId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_feedback_responses_MaverickId",
                table: "feedback_responses",
                column: "MaverickId");

            migrationBuilder.CreateIndex(
                name: "IX_notifications_RelatedCycleId",
                table: "notifications",
                column: "RelatedCycleId");

            migrationBuilder.CreateIndex(
                name: "IX_notifications_UserId_Status",
                table: "notifications",
                columns: new[] { "UserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_TokenHash",
                table: "refresh_tokens",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_UserId",
                table: "refresh_tokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_sessions_CourseId",
                table: "sessions",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_sessions_Status",
                table: "sessions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_sessions_TrainerId",
                table: "sessions",
                column: "TrainerId");

            migrationBuilder.CreateIndex(
                name: "IX_users_Email",
                table: "users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_ManagerId",
                table: "users",
                column: "ManagerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ai_insights");

            migrationBuilder.DropTable(
                name: "audit_logs");

            migrationBuilder.DropTable(
                name: "effectiveness_responses");

            migrationBuilder.DropTable(
                name: "enrollments");

            migrationBuilder.DropTable(
                name: "feedback_responses");

            migrationBuilder.DropTable(
                name: "notifications");

            migrationBuilder.DropTable(
                name: "refresh_tokens");

            migrationBuilder.DropTable(
                name: "feedback_cycles");

            migrationBuilder.DropTable(
                name: "sessions");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "courses");

            migrationBuilder.DropTable(
                name: "trainers");
        }
    }
}
