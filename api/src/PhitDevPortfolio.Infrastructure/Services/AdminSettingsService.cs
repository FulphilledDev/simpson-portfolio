using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;
using PhitDevPortfolio.Application.Options;
using PhitDevPortfolio.Domain.Entities;
using PhitDevPortfolio.Infrastructure.Persistence;
using System.Text.Json;

namespace PhitDevPortfolio.Infrastructure.Services;

public class AdminSettingsService(
    AppDbContext db,
    IBlobStorageService blob,
    IOptions<AzureOptions> azureOptions) : IAdminSettingsService
{
    private readonly AzureOptions _azure = azureOptions.Value;

    public async Task<AdminSettingsDto> GetAsync(CancellationToken ct = default)
    {
        var settings = await GetOrCreateAsync(ct);
        return ToDto(settings);
    }

    public async Task<AdminSettingsDto> UpdateAsync(UpdateAdminSettingsDto dto, CancellationToken ct = default)
    {
        var settings = await GetOrCreateAsync(ct);
        settings.Bio         = dto.Bio;
        settings.Skills      = JsonSerializer.Serialize(dto.Skills);
        settings.ContactEmail = dto.ContactEmail;
        settings.LinkedInUrl = dto.LinkedInUrl;
        settings.GitHubUrl   = dto.GitHubUrl;
        settings.TwitterUrl  = dto.TwitterUrl;
        settings.ResumeUrl   = dto.ResumeUrl;
        settings.OwnerName   = dto.OwnerName;
        settings.OwnerTitle  = dto.OwnerTitle;
        await db.SaveChangesAsync(ct);
        return ToDto(settings);
    }

    public async Task<AdminSettingsDto> UpdateProfilePhotoAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default)
    {
        var settings = await GetOrCreateAsync(ct);
        string url;

        if (string.IsNullOrEmpty(_azure.BlobStorageConnectionString))
        {
            // DevMode: save locally
            var dir    = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "profile");
            Directory.CreateDirectory(dir);
            var unique = $"profile_{Guid.NewGuid():N}{Path.GetExtension(fileName)}";
            var path   = Path.Combine(dir, unique);
            await using var fs = File.Create(path);
            await stream.CopyToAsync(fs, ct);
            url = $"{_azure.LocalDevBaseUrl}/uploads/profile/{unique}";
        }
        else
        {
            url = await blob.UploadAsync(stream, fileName, _azure.ProfileContainerName, ct);
        }

        settings.ProfilePhotoUrl = url;
        await db.SaveChangesAsync(ct);
        return ToDto(settings);
    }

    private async Task<AdminSettings> GetOrCreateAsync(CancellationToken ct)
    {
        var settings = await db.AdminSettings.FirstOrDefaultAsync(s => s.Id == 1, ct);
        if (settings is not null) return settings;

        settings = new AdminSettings { Id = 1 };
        db.AdminSettings.Add(settings);
        await db.SaveChangesAsync(ct);
        return settings;
    }

    private static AdminSettingsDto ToDto(AdminSettings s)
    {
        var skills = JsonSerializer.Deserialize<IEnumerable<string>>(s.Skills) ?? [];
        return new AdminSettingsDto(s.Bio, skills, s.ContactEmail, s.LinkedInUrl,
            s.GitHubUrl, s.TwitterUrl, s.ResumeUrl, s.ProfilePhotoUrl, s.OwnerName, s.OwnerTitle);
    }
}
