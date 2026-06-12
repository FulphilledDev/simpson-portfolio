using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace PhitDevPortfolio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class WeeklyAvailabilitySchedule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AvailabilitySlots");

            migrationBuilder.AddColumn<string>(
                name: "GoogleCalendarEventId",
                table: "AppointmentRequests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "RequestedDate",
                table: "AppointmentRequests",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "RequestedTime",
                table: "AppointmentRequests",
                type: "time without time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AppointmentDurationMinutes",
                table: "AdminSettings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "WeeklyAvailabilities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DayOfWeek = table.Column<int>(type: "integer", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeeklyAvailabilities", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "AdminSettings",
                keyColumn: "Id",
                keyValue: 1,
                column: "AppointmentDurationMinutes",
                value: 30);

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyAvailabilities_DayOfWeek",
                table: "WeeklyAvailabilities",
                column: "DayOfWeek",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WeeklyAvailabilities");

            migrationBuilder.DropColumn(
                name: "GoogleCalendarEventId",
                table: "AppointmentRequests");

            migrationBuilder.DropColumn(
                name: "RequestedDate",
                table: "AppointmentRequests");

            migrationBuilder.DropColumn(
                name: "RequestedTime",
                table: "AppointmentRequests");

            migrationBuilder.DropColumn(
                name: "AppointmentDurationMinutes",
                table: "AdminSettings");

            migrationBuilder.CreateTable(
                name: "AvailabilitySlots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AppointmentRequestId = table.Column<int>(type: "integer", nullable: true),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    GoogleCalendarEventId = table.Column<string>(type: "text", nullable: true),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AvailabilitySlots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AvailabilitySlots_AppointmentRequests_AppointmentRequestId",
                        column: x => x.AppointmentRequestId,
                        principalTable: "AppointmentRequests",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_AvailabilitySlots_AppointmentRequestId",
                table: "AvailabilitySlots",
                column: "AppointmentRequestId",
                unique: true);
        }
    }
}
