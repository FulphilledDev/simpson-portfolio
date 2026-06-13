namespace PhitDevPortfolio.Application.DTOs;

public record ProjectDto(
    int Id,
    string Title,
    string Slug,
    string ShortDescription,
    string? LongDescription,
    IEnumerable<string> TechStack,
    string? LiveUrl,
    string? GitHubUrl,
    string ThumbnailUrl,
    string? GifDemoUrl,
    IEnumerable<string> Screenshots,
    bool IsFeatured,
    bool IsActive,
    int SortOrder,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

public record CreateProjectDto(
    string Title,
    string ShortDescription,
    string? LongDescription,
    IEnumerable<string> TechStack,
    string? LiveUrl,
    string? GitHubUrl,
    bool IsFeatured,
    int SortOrder
);

public record UpdateProjectDto(
    string Title,
    string ShortDescription,
    string? LongDescription,
    IEnumerable<string> TechStack,
    string? LiveUrl,
    string? GitHubUrl,
    bool IsFeatured,
    bool IsActive,
    int SortOrder,
    /// <summary>Existing screenshot URLs to retain (omitted = keep all).</summary>
    IEnumerable<string>? ScreenshotsToKeep
);

public record ReorderProjectDto(int Id, int SortOrder);
