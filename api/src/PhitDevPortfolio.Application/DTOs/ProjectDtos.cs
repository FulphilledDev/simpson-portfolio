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
    int SortOrder
);

public record ReorderProjectDto(int Id, int SortOrder);
