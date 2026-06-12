namespace PhitDevPortfolio.Domain.Entities;

public class Review
{
    public int Id { get; set; }
    public string ReviewerName { get; set; } = string.Empty;
    public string? ReviewerTitle { get; set; }
    public string? ReviewerCompany { get; set; }

    [System.ComponentModel.DataAnnotations.MaxLength(1000)]
    public string Content { get; set; } = string.Empty;

    /// <summary>Star rating 1–5.</summary>
    public int Rating { get; set; }

    /// <summary>GUID token emailed to the reviewer. Single-use — consumed when SubmittedAt is set.</summary>
    public string ReviewToken { get; set; } = Guid.NewGuid().ToString();

    public DateTimeOffset RequestedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? SubmittedAt { get; set; }
    public bool IsApproved { get; set; }
    public bool IsPublished { get; set; }
    public int SortOrder { get; set; }
}
