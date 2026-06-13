using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PhitDevPortfolio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectScreenshots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Screenshots",
                table: "Projects",
                type: "text",
                nullable: false,
                defaultValue: "[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Screenshots",
                table: "Projects");
        }
    }
}
