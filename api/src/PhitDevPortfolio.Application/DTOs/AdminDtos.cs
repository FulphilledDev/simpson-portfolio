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
    string OwnerTitle,
    int AppointmentDurationMinutes,
    string CompanyName,
    string? CompanyLogoUrl
);

public record UpdateAdminSettingsDto(
    string Bio,
    IEnumerable<string> Skills,
    string ContactEmail,
    string? LinkedInUrl,
    string? GitHubUrl,
    string? TwitterUrl,
    string OwnerName,
    string OwnerTitle,
    int AppointmentDurationMinutes,
    string CompanyName
);

/// <summary>A single uploaded resume file returned to the client.</summary>
public record ResumeVersionDto(
    int Id,
    string FileName,
    string Url,
    DateTimeOffset UploadedAt,
    bool IsActive
);

public record SendResumeDto(string ToEmail, string ToName);

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
