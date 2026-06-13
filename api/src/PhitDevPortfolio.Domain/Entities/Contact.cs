namespace PhitDevPortfolio.Domain.Entities;

public class Contact
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Company { get; set; }

    /// <summary>Free-form admin notes about this contact.</summary>
    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// Optional link back to the appointment request this contact was created from.
    /// </summary>
    public int? AppointmentRequestId { get; set; }
    public AppointmentRequest? AppointmentRequest { get; set; }

    /// <summary>Reviews submitted by this contact (one per project).</summary>
    public ICollection<Review> Reviews { get; set; } = new List<Review>();

    /// <summary>Projects this contact is associated with.</summary>
    public ICollection<ProjectContact> ProjectContacts { get; set; } = new List<ProjectContact>();
}
