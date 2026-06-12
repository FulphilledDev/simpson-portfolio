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

    public ICollection<AppointmentMessage> Messages { get; set; } = new List<AppointmentMessage>();
    public AvailabilitySlot? LinkedSlot { get; set; }
}
