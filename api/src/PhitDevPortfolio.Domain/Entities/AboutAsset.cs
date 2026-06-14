namespace PhitDevPortfolio.Domain.Entities;

/// <summary>An image uploaded to the about-me blob container and tracked for admin assignment.</summary>
public class AboutAsset
{
    public int Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public DateTimeOffset UploadedAt { get; set; } = DateTimeOffset.UtcNow;
}
