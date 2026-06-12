using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;
using PhitDevPortfolio.Application.Options;
using PhitDevPortfolio.Domain.Entities;
using PhitDevPortfolio.Infrastructure.Persistence;

namespace PhitDevPortfolio.Infrastructure.Services;

public class ResumeVersionService(
    AppDbContext db,
    IBlobStorageService blob,
    IEmailService email,
    IOptions<AzureOptions> azureOptions) : IResumeVersionService
{
    private readonly AzureOptions _azure = azureOptions.Value;

    public async Task<IEnumerable<ResumeVersionDto>> GetAllAsync(CancellationToken ct = default)
    {
        var versions = await db.ResumeVersions
            .OrderByDescending(v => v.UploadedAt)
            .ToListAsync(ct);
        return versions.Select(ToDto);
    }

    public async Task<ResumeVersionDto> UploadAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default)
    {
        string url;

        if (string.IsNullOrEmpty(_azure.BlobStorageConnectionString))
        {
            // DevMode: save locally
            var dir    = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "resumes");
            Directory.CreateDirectory(dir);
            var unique = $"{Guid.NewGuid():N}_{Path.GetFileName(fileName)}";
            var path   = Path.Combine(dir, unique);
            await using var fs = File.Create(path);
            await stream.CopyToAsync(fs, ct);
            url = $"{_azure.LocalDevBaseUrl}/uploads/resumes/{unique}";
        }
        else
        {
            url = await blob.UploadAsync(stream, fileName, _azure.ResumesContainerName, ct);
        }

        var version = new ResumeVersion
        {
            FileName   = Path.GetFileName(fileName),
            Url        = url,
            UploadedAt = DateTimeOffset.UtcNow,
            IsActive   = false
        };

        db.ResumeVersions.Add(version);
        await db.SaveChangesAsync(ct);
        return ToDto(version);
    }

    public async Task<ResumeVersionDto> SetActiveAsync(int id, CancellationToken ct = default)
    {
        var target = await db.ResumeVersions.FindAsync([id], ct)
            ?? throw new KeyNotFoundException($"Resume version {id} not found.");

        // Deactivate all others
        await db.ResumeVersions
            .Where(v => v.IsActive)
            .ExecuteUpdateAsync(s => s.SetProperty(v => v.IsActive, false), ct);

        target.IsActive = true;
        await db.SaveChangesAsync(ct);

        // Sync the active URL into AdminSettings so /api/settings returns it
        var settings = await db.AdminSettings.FirstOrDefaultAsync(s => s.Id == 1, ct);
        if (settings is not null)
        {
            settings.ResumeUrl = target.Url;
            await db.SaveChangesAsync(ct);
        }

        return ToDto(target);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var version = await db.ResumeVersions.FindAsync([id], ct)
            ?? throw new KeyNotFoundException($"Resume version {id} not found.");

        // Remove from storage
        if (!string.IsNullOrEmpty(_azure.BlobStorageConnectionString))
        {
            await blob.DeleteAsync(version.Url, _azure.ResumesContainerName, ct);
        }
        else
        {
            // DevMode: delete local file
            var uri  = new Uri(version.Url);
            var file = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot",
                uri.AbsolutePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
            if (File.Exists(file)) File.Delete(file);
        }

        var wasActive = version.IsActive;
        db.ResumeVersions.Remove(version);
        await db.SaveChangesAsync(ct);

        // If we deleted the active version, clear AdminSettings.ResumeUrl
        if (wasActive)
        {
            var settings = await db.AdminSettings.FirstOrDefaultAsync(s => s.Id == 1, ct);
            if (settings is not null)
            {
                settings.ResumeUrl = null;
                await db.SaveChangesAsync(ct);
            }
        }
    }

    private static ResumeVersionDto ToDto(ResumeVersion v) =>
        new(v.Id, v.FileName, v.Url, v.UploadedAt, v.IsActive);

    public async Task<(Stream Stream, string FileName, string ContentType)> GetDownloadStreamAsync(int id, CancellationToken ct = default)
    {
        var version = await db.ResumeVersions.FindAsync([id], ct)
            ?? throw new KeyNotFoundException($"Resume version {id} not found.");

        Stream stream;

        if (string.IsNullOrEmpty(_azure.BlobStorageConnectionString))
        {
            var uri  = new Uri(version.Url);
            var file = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot",
                uri.AbsolutePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
            stream = File.OpenRead(file);
        }
        else
        {
            stream = await blob.DownloadAsync(version.Url, _azure.ResumesContainerName, ct);
        }

        return (stream, version.FileName, GetContentType(version.FileName));
    }

    public async Task SendByEmailAsync(int id, string toEmail, string toName, CancellationToken ct = default)
    {
        var (stream, fileName, _) = await GetDownloadStreamAsync(id, ct);
        await using (stream)
        {
            using var ms = new MemoryStream();
            await stream.CopyToAsync(ms, ct);
            await email.SendResumeAsync(toEmail, toName, fileName, ms.ToArray(), ct);
        }
    }

    private static string GetContentType(string fileName) =>
        Path.GetExtension(fileName).ToLowerInvariant() switch
        {
            ".pdf"  => "application/pdf",
            ".doc"  => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            _       => "application/octet-stream"
        };
}
