using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HexaLoop.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddReports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "reports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Scope = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Format = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CycleStatusFilter = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    DateFrom = table.Column<DateOnly>(type: "date", nullable: true),
                    DateTo = table.Column<DateOnly>(type: "date", nullable: true),
                    DownloadUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RowCount = table.Column<int>(type: "integer", nullable: true),
                    RequestedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_reports_users_RequestedByUserId",
                        column: x => x.RequestedByUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_reports_RequestedAt",
                table: "reports",
                column: "RequestedAt");

            migrationBuilder.CreateIndex(
                name: "IX_reports_RequestedByUserId",
                table: "reports",
                column: "RequestedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "reports");
        }
    }
}
