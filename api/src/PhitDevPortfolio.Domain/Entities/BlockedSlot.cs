namespace PhitDevPortfolio.Domain.Entities;

public class BlockedSlot
{
    public int Id { get; set; }
    public DateTimeOffset Start { get; set; }
    public DateTimeOffset End { get; set; }
    public string? Reason { get; set; }
}
