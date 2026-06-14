namespace PhitDevPortfolio.Application.DTOs;

public record PrincipleDto(string Icon, string Name, string Description);

public record AboutSectionDto(
    string? Header,
    IEnumerable<PrincipleDto> Principles,
    string? AboutPhotoUrl
);

public record UpdateAboutSectionDto(
    string? Header,
    IEnumerable<PrincipleDto> Principles
);

public record AssignAboutPhotoDto(string? PhotoUrl);

public record AboutAssetDto(
    int Id,
    string Url,
    string FileName,
    DateTimeOffset UploadedAt
);
