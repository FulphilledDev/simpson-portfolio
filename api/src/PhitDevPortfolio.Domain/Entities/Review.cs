namespace PhitDevPortfolio.Domain.Entities;

public class Review
{
    public int Id { get; set; }

    [System.ComponentModel.DataAnnotations.MaxLength(2000)]
    public string ProsContent { get; set; } = string.Empty;

    [System.ComponentModel.DataAnnotations.MaxLength(2000)]
    public string ConsContent { get; set; } = string.Empty;

    /// <summary>Rating 1–10, supports half-point increments (e.g. 9.5).</summary>
    public decimal Rating { get; set; }

    /// <summary>GUID token emailed to the reviewer. Single-use — consumed when SubmittedAt is set.</summary>
    public string ReviewToken { get; set; } = Guid.NewGuid().ToString();

    public DateTimeOffset RequestedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? SubmittedAt { get; set; }
    public bool IsApproved { get; set; }
    public bool IsPublished { get; set; }
    public int SortOrder { get; set; }

    /// <summary>Optional project this review is for. Enforces one review per contact per project.</summary>
    public int? ProjectId { get; set; }
    public Project? Project { get; set; }

    /// <summary>Required — all reviewer identity comes from the linked contact.</summary>
    public int ContactId { get; set; }
    public Contact Contact { get; set; } = null!;
}
