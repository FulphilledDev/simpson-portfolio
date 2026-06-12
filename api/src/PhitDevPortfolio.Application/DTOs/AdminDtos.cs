namespace PhitDevPortfolio.Application.DTOs;

public record AdminSettingsDto(
    string Bio,
    IEnumerable<string> Skills,
    string ContactEmail,
    string? LinkedInUrl,
    string? GitHubUrl,
    string? TwitterUrl,
    string? ResumeUrl,
    string? ProfilePhotoUrl,
    string OwnerName,
    string OwnerTitle
);

public record UpdateAdminSettingsDto(
    string Bio,
    IEnumerable<string> Skills,
    string ContactEmail,
    string? LinkedInUrl,
    string? GitHubUrl,
    string? TwitterUrl,
    string? ResumeUrl,
    string OwnerName,
    string OwnerTitle
);

public record AuthResultDto(
    string Token,
    string Email,
    string Name
);

public record GoogleAuthDto(string IdToken);

public record GoogleCalendarStatusDto(
    bool IsConnected,
    string? ConnectedEmail,
    string? CalendarId,
    DateTimeOffset? TokenExpiresAt,
    bool AutoSync
);
