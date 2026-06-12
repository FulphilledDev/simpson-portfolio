using PhitDevPortfolio.Domain.Enums;

namespace PhitDevPortfolio.Domain.Entities;

public class AppointmentRequest
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public ProjectType ProjectType { get; set; }
    public string? Budget { get; set; }
    public string Message { get; set; } = string.Empty;
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Pending;
    public DateTimeOffset SubmittedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? RespondedAt { get; set; }
    public string? OwnerNotes { get; set; }

    /// <summary>
    /// GUID token issued to the client on submission — used for the public tokenized chat endpoint.
    /// </summary>
    public string ClientToken { get; set; } = Guid.NewGuid().ToString();

    /// <summary>Requested appointment date selected by the client at submission time.</summary>
    public DateOnly? RequestedDate { get; set; }

    /// <summary>Requested appointment start time selected by the client at submission time.</summary>
    public TimeOnly? RequestedTime { get; set; }

    /// <summary>Confirmed appointment date set by the owner.</summary>
    public DateOnly? ScheduledDate { get; set; }

    /// <summary>Confirmed appointment start time set by the owner.</summary>
    public TimeOnly? ScheduledTime { get; set; }

    /// <summary>Google Calendar event ID created when the appointment is accepted.</summary>
    public string? GoogleCalendarEventId { get; set; }

    public ICollection<AppointmentMessage> Messages { get; set; } = new List<AppointmentMessage>();
}
