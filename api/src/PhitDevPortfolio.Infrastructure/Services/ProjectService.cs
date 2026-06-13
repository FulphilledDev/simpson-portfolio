using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;
using PhitDevPortfolio.Application.Options;
using PhitDevPortfolio.Domain.Entities;
using PhitDevPortfolio.Infrastructure.Persistence;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace PhitDevPortfolio.Infrastructure.Services;

public class ProjectService(
    AppDbContext db,
    IBlobStorageService blob,
    IOptions<AzureOptions> azureOptions,
    ILogger<ProjectService> logger) : IProjectService
{
    private readonly AzureOptions _azure = azureOptions.Value;

    public async Task<IEnumerable<ProjectDto>> GetAllAsync(bool featuredOnly = false, CancellationToken ct = default)
    {
        var query = db.Projects.AsNoTracking().Where(p => p.IsActive);
        if (featuredOnly) query = query.Where(p => p.IsFeatured);
        var items = await query.OrderBy(p => p.SortOrder).ToListAsync(ct);
        return items.Select(ToDto);
    }

    public async Task<ProjectDto?> GetBySlugAsync(string slug, CancellationToken ct = default)
    {
        var item = await db.Projects.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Slug == slug && p.IsActive, ct);
        return item is null ? null : ToDto(item);
    }

    public async Task<ProjectDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var item = await db.Projects.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, ct);
        return item is null ? null : ToDto(item);
    }

    public async Task<ProjectDto> CreateAsync(CreateProjectDto dto, Stream? thumbnailStream, string? thumbnailFileName,
        Stream? gifStream, string? gifFileName, IEnumerable<(Stream Stream, string FileName)>? screenshotFiles, CancellationToken ct = default)
    {
        var entity = new Project
        {
            Title            = dto.Title,
            Slug             = await GenerateUniqueSlugAsync(dto.Title, null, ct),
            ShortDescription = dto.ShortDescription,
            LongDescription  = dto.LongDescription,
            TechStack        = JsonSerializer.Serialize(dto.TechStack),
            LiveUrl          = dto.LiveUrl,
            GitHubUrl        = dto.GitHubUrl,
            IsFeatured       = dto.IsFeatured,
            SortOrder        = dto.SortOrder
        };

        if (thumbnailStream is not null && thumbnailFileName is not null)
            entity.ThumbnailUrl = await UploadFileAsync(thumbnailStream, thumbnailFileName, entity.Slug, "thumbnails", ct);

        if (gifStream is not null && gifFileName is not null)
            entity.GifDemoUrl = await UploadFileAsync(gifStream, gifFileName, entity.Slug, "media", ct);

        if (screenshotFiles is not null)
        {
            var urls = new List<string>();
            foreach (var (stream, name) in screenshotFiles)
                urls.Add(await UploadFileAsync(stream, name, entity.Slug, "screenshots", ct));
            entity.Screenshots = JsonSerializer.Serialize(urls);
        }

        db.Projects.Add(entity);
        await db.SaveChangesAsync(ct);
        return ToDto(entity);
    }

    public async Task<ProjectDto?> UpdateAsync(int id, UpdateProjectDto dto, Stream? thumbnailStream, string? thumbnailFileName,
        Stream? gifStream, string? gifFileName, IEnumerable<(Stream Stream, string FileName)>? screenshotFiles, CancellationToken ct = default)
    {
        var entity = await db.Projects.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (entity is null) return null;

        entity.Title            = dto.Title;
        entity.Slug             = await GenerateUniqueSlugAsync(dto.Title, id, ct);
        entity.ShortDescription = dto.ShortDescription;
        entity.LongDescription  = dto.LongDescription;
        entity.TechStack        = JsonSerializer.Serialize(dto.TechStack);
        entity.LiveUrl          = dto.LiveUrl;
        entity.GitHubUrl        = dto.GitHubUrl;
        entity.IsFeatured       = dto.IsFeatured;
        entity.IsActive         = dto.IsActive;
        entity.SortOrder        = dto.SortOrder;
        entity.UpdatedAt        = DateTimeOffset.UtcNow;

        if (thumbnailStream is not null && thumbnailFileName is not null)
            entity.ThumbnailUrl = await UploadFileAsync(thumbnailStream, thumbnailFileName, entity.Slug, "thumbnails", ct);

        if (gifStream is not null && gifFileName is not null)
            entity.GifDemoUrl = await UploadFileAsync(gifStream, gifFileName, entity.Slug, "media", ct);

        // Use kept list only when client explicitly sent ScreenshotsChanged; otherwise preserve existing
        var kept = dto.ScreenshotsChanged
            ? dto.ScreenshotsToKeep?.ToList() ?? []
            : JsonSerializer.Deserialize<List<string>>(entity.Screenshots) ?? [];
        if (screenshotFiles is not null)
        {
            foreach (var (stream, name) in screenshotFiles)
                kept.Add(await UploadFileAsync(stream, name, entity.Slug, "screenshots", ct));
        }
        entity.Screenshots = JsonSerializer.Serialize(kept);

        await db.SaveChangesAsync(ct);
        return ToDto(entity);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await db.Projects.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (entity is null) return false;
        entity.IsActive = false;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task ReorderAsync(IEnumerable<ReorderProjectDto> items, CancellationToken ct = default)
    {
        var ids = items.Select(i => i.Id).ToList();
        var projects = await db.Projects.Where(p => ids.Contains(p.Id)).ToListAsync(ct);
        foreach (var item in items)
        {
            var project = projects.FirstOrDefault(p => p.Id == item.Id);
            if (project is not null) project.SortOrder = item.SortOrder;
        }
        await db.SaveChangesAsync(ct);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private async Task<string> UploadFileAsync(Stream stream, string fileName, string slug, string folder, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(_azure.BlobStorageConnectionString))
        {
            logger.LogWarning("ProjectService: BlobStorageConnectionString is empty — falling back to local wwwroot storage. This should NOT happen in production.");
            // DevMode: save to wwwroot/uploads/projects/{slug}/{folder}/
            var dir  = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "projects", slug, folder);
            Directory.CreateDirectory(dir);
            var unique = $"{Guid.NewGuid():N}_{Path.GetFileName(fileName)}";
            var path   = Path.Combine(dir, unique);
            await using var fs = File.Create(path);
            await stream.CopyToAsync(fs, ct);
            return $"{_azure.LocalDevBaseUrl}/uploads/projects/{slug}/{folder}/{unique}";
        }
        return await blob.UploadAsync(stream, fileName, _azure.ProjectsContainerName, isPublic: true, $"{slug}/{folder}", ct);
    }

    private async Task<string> GenerateUniqueSlugAsync(string title, int? excludeId, CancellationToken ct)
    {
        var baseSlug = Regex.Replace(title.ToLowerInvariant(), @"[^a-z0-9]+", "-").Trim('-');
        var slug     = baseSlug;
        var counter  = 1;

        while (await db.Projects.AnyAsync(p => p.Slug == slug && p.Id != (excludeId ?? -1), ct))
            slug = $"{baseSlug}-{counter++}";

        return slug;
    }

    internal static ProjectDto ToDto(Project p)
    {
        var techStack   = JsonSerializer.Deserialize<IEnumerable<string>>(p.TechStack)   ?? [];
        var screenshots = string.IsNullOrWhiteSpace(p.Screenshots)
            ? []
            : JsonSerializer.Deserialize<IEnumerable<string>>(p.Screenshots) ?? [];
        return new ProjectDto(p.Id, p.Title, p.Slug, p.ShortDescription, p.LongDescription,
            techStack, p.LiveUrl, p.GitHubUrl, p.ThumbnailUrl, p.GifDemoUrl, screenshots,
            p.IsFeatured, p.IsActive, p.SortOrder, p.CreatedAt, p.UpdatedAt);
    }
}
