namespace PhitDevPortfolio.Domain.Entities;

/// <summary>Many-to-many join between contacts and projects (admin-side only).</summary>
public class ProjectContact
{
    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public int ContactId { get; set; }
    public Contact Contact { get; set; } = null!;

    public DateTimeOffset AssignedAt { get; set; } = DateTimeOffset.UtcNow;
}
