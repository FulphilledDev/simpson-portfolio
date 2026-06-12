using PhitDevPortfolio.Domain.Enums;

namespace PhitDevPortfolio.Domain.Entities;

public class AppointmentMessage
{
    public int Id { get; set; }
    public int AppointmentRequestId { get; set; }
    public AppointmentRequest AppointmentRequest { get; set; } = null!;

    public MessageSender Sender { get; set; }

    [System.ComponentModel.DataAnnotations.MaxLength(2000)]
    public string Content { get; set; } = string.Empty;

    public DateTimeOffset SentAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsReadByOwner { get; set; }
    public bool IsReadByClient { get; set; }
}
