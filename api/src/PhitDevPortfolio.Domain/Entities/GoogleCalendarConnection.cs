namespace PhitDevPortfolio.Domain.Entities;

/// <summary>Stores the Google Calendar OAuth connection for the portfolio owner. Singleton (Id = 1).</summary>
public class GoogleCalendarConnection
{
    public int Id { get; set; }
    public string CalendarId { get; set; } = "primary";
    public string ConnectedEmail { get; set; } = string.Empty;

    /// <summary>Encrypted at rest via AES-256.</summary>
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>Encrypted at rest via AES-256.</summary>
    public string RefreshToken { get; set; } = string.Empty;

    public DateTimeOffset TokenExpiresAt { get; set; }
    public DateTimeOffset ConnectedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsActive { get; set; } = true;
    public bool AutoSync { get; set; } = true;
}
