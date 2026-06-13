using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PhitDevPortfolio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyBranding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CompanyLogoUrl",
                table: "AdminSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompanyName",
                table: "AdminSettings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "AdminSettings",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CompanyLogoUrl", "CompanyName" },
                values: new object[] { null, "" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompanyLogoUrl",
                table: "AdminSettings");

            migrationBuilder.DropColumn(
                name: "CompanyName",
                table: "AdminSettings");
        }
    }
}
