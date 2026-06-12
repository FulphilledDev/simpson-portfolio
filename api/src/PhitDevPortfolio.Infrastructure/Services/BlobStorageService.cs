using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Options;
using PhitDevPortfolio.Application.Interfaces;
using PhitDevPortfolio.Application.Options;

namespace PhitDevPortfolio.Infrastructure.Services;

public class BlobStorageService(IOptions<AzureOptions> options) : IBlobStorageService
{
    private readonly string _connectionString = options.Value.BlobStorageConnectionString;

    public async Task<string> UploadAsync(Stream stream, string fileName, string containerName, CancellationToken ct = default)
    {
        var client    = new BlobServiceClient(_connectionString);
        var container = client.GetBlobContainerClient(containerName);
        await container.CreateIfNotExistsAsync(PublicAccessType.Blob, cancellationToken: ct);

        var blobName   = $"{Guid.NewGuid():N}_{Path.GetFileName(fileName)}";
        var blobClient = container.GetBlobClient(blobName);
        await blobClient.UploadAsync(stream, overwrite: true, cancellationToken: ct);
        return blobClient.Uri.ToString();
    }

    public async Task DeleteAsync(string blobUrl, string containerName, CancellationToken ct = default)
    {
        var uri       = new Uri(blobUrl);
        var blobName  = uri.Segments.Last();
        var client    = new BlobServiceClient(_connectionString);
        var container = client.GetBlobContainerClient(containerName);
        await container.GetBlobClient(blobName).DeleteIfExistsAsync(cancellationToken: ct);
    }
}
