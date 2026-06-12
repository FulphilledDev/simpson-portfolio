using PhitDevPortfolio.Domain.Enums;

namespace PhitDevPortfolio.Domain.Entities;

public class AvailabilitySlot
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public AvailabilitySlotType Type { get; set; }
    public bool IsPublic { get; set; } = true;
    public string? Notes { get; set; }

    /// <summary>Google Calendar event ID stored after sync.</summary>
    public string? GoogleCalendarEventId { get; set; }

    public int? AppointmentRequestId { get; set; }
    public AppointmentRequest? AppointmentRequest { get; set; }
}
