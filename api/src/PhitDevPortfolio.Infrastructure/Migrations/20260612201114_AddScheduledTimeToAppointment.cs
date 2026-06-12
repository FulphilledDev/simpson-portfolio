using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PhitDevPortfolio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddScheduledTimeToAppointment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "ScheduledDate",
                table: "AppointmentRequests",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "ScheduledTime",
                table: "AppointmentRequests",
                type: "time without time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ScheduledDate",
                table: "AppointmentRequests");

            migrationBuilder.DropColumn(
                name: "ScheduledTime",
                table: "AppointmentRequests");
        }
    }
}
