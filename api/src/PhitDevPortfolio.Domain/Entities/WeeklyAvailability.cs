namespace PhitDevPortfolio.Domain.Entities;

/// <summary>
/// Defines the owner's recurring weekly availability for appointments.
/// One record per day of week (0=Sunday … 6=Saturday).
/// </summary>
public class WeeklyAvailability
{
    public int Id { get; set; }

    /// <summary>0 = Sunday, 1 = Monday, … 6 = Saturday</summary>
    public DayOfWeek DayOfWeek { get; set; }

    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    public bool IsEnabled { get; set; } = true;
}
