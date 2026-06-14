using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;
using PhitDevPortfolio.Application.Options;
using PhitDevPortfolio.Domain.Entities;
using PhitDevPortfolio.Infrastructure.Persistence;
using System.Text.Json;

namespace PhitDevPortfolio.Infrastructure.Services;

public class AboutSectionService(
    AppDbContext db,
    IBlobStorageService blob,
    IOptions<AzureOptions> azureOptions) : IAboutSectionService, IAboutAssetService
{
    private readonly AzureOptions _azure = azureOptions.Value;

    // ── AboutSection ──────────────────────────────────────────────────────────

    public async Task<AboutSectionDto> GetAsync(CancellationToken ct = default)
    {
        var about = await GetOrCreateAboutAsync(ct);
        return ToDto(about);
    }

    public async Task<AboutSectionDto> UpdateAsync(UpdateAboutSectionDto dto, CancellationToken ct = default)
    {
        var about = await GetOrCreateAboutAsync(ct);
        about.Header     = string.IsNullOrWhiteSpace(dto.Header) ? null : dto.Header.Trim();
        about.Principles = JsonSerializer.Serialize(dto.Principles);
        await db.SaveChangesAsync(ct);
        return ToDto(about);
    }

    public async Task<AboutSectionDto> SetAboutPhotoAsync(string? photoUrl, CancellationToken ct = default)
    {
        var about = await GetOrCreateAboutAsync(ct);
        about.AboutPhotoUrl = photoUrl;
        await db.SaveChangesAsync(ct);
        return ToDto(about);
    }

    // ── AboutAsset ────────────────────────────────────────────────────────────

    public async Task<IEnumerable<AboutAssetDto>> GetAllAsync(CancellationToken ct = default)
    {
        var assets = await db.AboutAssets.OrderByDescending(a => a.UploadedAt).ToListAsync(ct);
        return assets.Select(ToAssetDto);
    }

    public async Task<AboutAssetDto> UploadAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default)
    {
        string url;

        if (string.IsNullOrEmpty(_azure.BlobStorageConnectionString))
        {
            var dir    = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "about");
            Directory.CreateDirectory(dir);
            var unique = $"about_{Guid.NewGuid():N}{Path.GetExtension(fileName)}";
            var path   = Path.Combine(dir, unique);
            await using var fs = File.Create(path);
            await stream.CopyToAsync(fs, ct);
            url = $"{_azure.LocalDevBaseUrl}/uploads/about/{unique}";
        }
        else
        {
            url = await blob.UploadAsync(stream, fileName, _azure.AboutContainerName, isPublic: true, ct: ct);
        }

        var asset = new AboutAsset
        {
            Url        = url,
            FileName   = fileName,
            UploadedAt = DateTimeOffset.UtcNow,
        };
        db.AboutAssets.Add(asset);
        await db.SaveChangesAsync(ct);
        return ToAssetDto(asset);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var asset = await db.AboutAssets.FindAsync([id], ct)
            ?? throw new KeyNotFoundException($"AboutAsset {id} not found.");

        // Delete from blob / disk
        if (!string.IsNullOrEmpty(_azure.BlobStorageConnectionString))
            await blob.DeleteAsync(asset.Url, _azure.AboutContainerName, ct);
        else
        {
            var localPath = UrlToLocalPath(asset.Url);
            if (File.Exists(localPath)) File.Delete(localPath);
        }

        // Clear assignments if this asset is currently assigned
        var about    = await GetOrCreateAboutAsync(ct);
        var settings = await db.AdminSettings.FirstOrDefaultAsync(s => s.Id == 1, ct);

        if (about.AboutPhotoUrl == asset.Url)
        {
            about.AboutPhotoUrl = null;
            await db.SaveChangesAsync(ct);
        }
        if (settings is not null && settings.ProfilePhotoUrl == asset.Url)
        {
            settings.ProfilePhotoUrl = null;
            await db.SaveChangesAsync(ct);
        }

        db.AboutAssets.Remove(asset);
        await db.SaveChangesAsync(ct);
    }

    public async Task SetAsProfilePhotoAsync(int id, CancellationToken ct = default)
    {
        var asset    = await db.AboutAssets.FindAsync([id], ct)
            ?? throw new KeyNotFoundException($"AboutAsset {id} not found.");
        var settings = await db.AdminSettings.FirstOrDefaultAsync(s => s.Id == 1, ct);
        if (settings is null)
        {
            settings = new AdminSettings { Id = 1 };
            db.AdminSettings.Add(settings);
        }
        settings.ProfilePhotoUrl = asset.Url;
        await db.SaveChangesAsync(ct);
    }

    public async Task SetAsAboutPhotoAsync(int id, CancellationToken ct = default)
    {
        var asset = await db.AboutAssets.FindAsync([id], ct)
            ?? throw new KeyNotFoundException($"AboutAsset {id} not found.");
        var about = await GetOrCreateAboutAsync(ct);
        about.AboutPhotoUrl = asset.Url;
        await db.SaveChangesAsync(ct);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private async Task<AboutSection> GetOrCreateAboutAsync(CancellationToken ct)
    {
        var about = await db.AboutSections.FirstOrDefaultAsync(a => a.Id == 1, ct);
        if (about is not null) return about;

        about = new AboutSection { Id = 1 };
        db.AboutSections.Add(about);
        await db.SaveChangesAsync(ct);
        return about;
    }

    private static AboutSectionDto ToDto(AboutSection a)
    {
        var principles = Enumerable.Empty<PrincipleDto>();
        try
        {
            if (!string.IsNullOrWhiteSpace(a.Principles) && a.Principles != "[]")
                principles = JsonSerializer.Deserialize<IEnumerable<PrincipleDto>>(a.Principles,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                    ?? Enumerable.Empty<PrincipleDto>();
        }
        catch { /* return empty on malformed JSON */ }

        return new AboutSectionDto(a.Header, principles, a.AboutPhotoUrl);
    }

    private static AboutAssetDto ToAssetDto(AboutAsset a) =>
        new(a.Id, a.Url, a.FileName, a.UploadedAt);

    private string UrlToLocalPath(string url)
    {
        var prefix = $"{_azure.LocalDevBaseUrl}/uploads/about/";
        if (url.StartsWith(prefix))
        {
            var fileName = url[prefix.Length..];
            return Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "about", fileName);
        }
        return string.Empty;
    }
}
