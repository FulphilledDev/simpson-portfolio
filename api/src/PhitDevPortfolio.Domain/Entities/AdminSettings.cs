namespace PhitDevPortfolio.Domain.Entities;

/// <summary>Singleton (Id always = 1). Owner profile and global site settings.</summary>
public class AdminSettings
{
    public int Id { get; set; } = 1;

    [System.ComponentModel.DataAnnotations.MaxLength(2000)]
    public string Bio { get; set; } = string.Empty;

    /// <summary>JSON array of skill/technology names.</summary>
    public string Skills { get; set; } = "[]";

    public string ContactEmail { get; set; } = string.Empty;
    public string? LinkedInUrl { get; set; }
    public string? GitHubUrl { get; set; }
    public string? TwitterUrl { get; set; }
    public string? ResumeUrl { get; set; }
    public string? ProfilePhotoUrl { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerTitle { get; set; } = string.Empty;
}
