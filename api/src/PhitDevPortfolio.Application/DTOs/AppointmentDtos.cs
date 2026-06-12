using PhitDevPortfolio.Domain.Enums;

namespace PhitDevPortfolio.Application.DTOs;

public record AppointmentRequestDto(
    int Id,
    string Name,
    string Email,
    string? Phone,
    ProjectType ProjectType,
    string? Budget,
    string Message,
    AppointmentStatus Status,
    DateTimeOffset SubmittedAt,
    DateTimeOffset? RespondedAt,
    string? OwnerNotes,
    string ClientToken
);

public record CreateAppointmentRequestDto(
    string Name,
    string Email,
    string? Phone,
    ProjectType ProjectType,
    string? Budget,
    string Message
);

public record RespondToAppointmentDto(
    AppointmentStatus Status,
    string? OwnerNotes,
    string? ResponseMessage
);

public record AppointmentMessageDto(
    int Id,
    int AppointmentRequestId,
    MessageSender Sender,
    string Content,
    DateTimeOffset SentAt,
    bool IsReadByOwner,
    bool IsReadByClient
);

public record CreateAppointmentMessageDto(string Content);

public record ConversationPreviewDto(
    int AppointmentRequestId,
    string ClientName,
    string ClientEmail,
    AppointmentStatus Status,
    string? LastMessage,
    DateTimeOffset? LastMessageAt,
    int OwnerUnreadCount,
    int ClientUnreadCount
);

public record ClientChatDto(
    int AppointmentRequestId,
    string ClientName,
    AppointmentStatus Status,
    bool IsTokenValid,
    IEnumerable<AppointmentMessageDto> Messages
);
