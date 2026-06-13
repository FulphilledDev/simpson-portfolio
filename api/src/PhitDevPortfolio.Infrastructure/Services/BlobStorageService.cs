using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PhitDevPortfolio.Application.Interfaces;
using PhitDevPortfolio.Application.Options;

namespace PhitDevPortfolio.Infrastructure.Services;

public class BlobStorageService(IOptions<AzureOptions> options, ILogger<BlobStorageService> logger) : IBlobStorageService
{
    private readonly string _connectionString = options.Value.BlobStorageConnectionString;

    public async Task<string> UploadAsync(Stream stream, string fileName, string containerName, bool isPublic = false, string? blobFolder = null, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(_connectionString))
            throw new InvalidOperationException(
                "Azure:BlobStorageConnectionString is not configured. Set the Azure__BlobStorageConnectionString environment variable in Azure App Service.");

        logger.LogInformation("BlobStorage: uploading '{FileName}' to container='{Container}' folder='{Folder}'",
            fileName, containerName, blobFolder ?? "(root)");

        var client      = new BlobServiceClient(_connectionString);
        var container   = client.GetBlobContainerClient(containerName);
        var accessType  = isPublic ? PublicAccessType.Blob : PublicAccessType.None;
        await container.CreateIfNotExistsAsync(accessType, cancellationToken: ct);

        var safeName  = $"{Guid.NewGuid():N}_{Path.GetFileName(fileName)}";
        var blobName  = string.IsNullOrEmpty(blobFolder)
            ? safeName
            : $"{blobFolder.Trim('/')}/{safeName}";
        var blobClient = container.GetBlobClient(blobName);
        await blobClient.UploadAsync(stream, overwrite: true, cancellationToken: ct);

        logger.LogInformation("BlobStorage: upload succeeded → {Uri}", blobClient.Uri);
        return blobClient.Uri.ToString();
    }

    public async Task DeleteAsync(string blobUrl, string containerName, CancellationToken ct = default)
    {
        var blobName  = ExtractBlobName(blobUrl, containerName);
        var client    = new BlobServiceClient(_connectionString);
        var container = client.GetBlobContainerClient(containerName);
        await container.GetBlobClient(blobName).DeleteIfExistsAsync(cancellationToken: ct);
    }

    public async Task<Stream> DownloadAsync(string blobUrl, string containerName, CancellationToken ct = default)
    {
        var blobName  = ExtractBlobName(blobUrl, containerName);
        var client    = new BlobServiceClient(_connectionString);
        var container = client.GetBlobContainerClient(containerName);
        var ms        = new MemoryStream();
        await container.GetBlobClient(blobName).DownloadToAsync(ms, ct);
        ms.Position = 0;
        return ms;
    }

    /// <summary>
    /// Extracts the blob name (including any virtual folder path) from a full blob URL.
    /// e.g. https://account.blob.core.windows.net/projects/slug/thumbnails/file.jpg
    ///      → "slug/thumbnails/file.jpg"
    /// </summary>
    private static string ExtractBlobName(string blobUrl, string containerName)
    {
        var uri           = new Uri(blobUrl);
        var containerPath = $"/{containerName}/";
        var idx           = uri.AbsolutePath.IndexOf(containerPath, StringComparison.Ordinal);
        return idx >= 0
            ? Uri.UnescapeDataString(uri.AbsolutePath[(idx + containerPath.Length)..])
            : uri.Segments.Last();
    }
}
