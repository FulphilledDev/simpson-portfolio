namespace PhitDevPortfolio.Domain.Entities;

public class Project
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;

    /// <summary>URL-safe unique identifier generated from title. Used as public URL slug.</summary>
    public string Slug { get; set; } = string.Empty;

    public string ShortDescription { get; set; } = string.Empty;
    public string? LongDescription { get; set; }

    /// <summary>JSON array of technology names, e.g. ["Angular","C#",".NET"]</summary>
    public string TechStack { get; set; } = "[]";

    public string? LiveUrl { get; set; }
    public string? GitHubUrl { get; set; }
    public string ThumbnailUrl { get; set; } = string.Empty;

    /// <summary>Optional animated GIF demo hosted in Azure Blob.</summary>
    public string? GifDemoUrl { get; set; }

    /// <summary>JSON array of screenshot URLs, e.g. ["https://...","https://..."]</summary>
    public string Screenshots { get; set; } = "[]";

    public bool IsFeatured { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>Contacts associated with this project (admin-side only).</summary>
    public ICollection<ProjectContact> ProjectContacts { get; set; } = new List<ProjectContact>();
}
