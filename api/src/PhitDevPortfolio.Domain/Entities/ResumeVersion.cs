namespace PhitDevPortfolio.Domain.Entities;

/// <summary>A single uploaded resume file. Only one can be active at a time.</summary>
public class ResumeVersion
{
    public int Id { get; set; }

    /// <summary>The original file name shown in the UI.</summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>Publicly accessible URL (blob or local dev).</summary>
    public string Url { get; set; } = string.Empty;

    public DateTimeOffset UploadedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>True for whichever version is currently the live resume link.</summary>
    public bool IsActive { get; set; } = false;
}
