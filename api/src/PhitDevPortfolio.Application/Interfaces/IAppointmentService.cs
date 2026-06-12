using PhitDevPortfolio.Application.DTOs;

namespace PhitDevPortfolio.Application.Interfaces;

public interface IAppointmentService
{
    Task<IEnumerable<AppointmentRequestDto>> GetAllAsync(CancellationToken ct = default);
    Task<AppointmentRequestDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<AppointmentRequestDto> CreateAsync(CreateAppointmentRequestDto dto, CancellationToken ct = default);
    Task<AppointmentRequestDto?> RespondAsync(int id, RespondToAppointmentDto dto, CancellationToken ct = default);
    Task<AppointmentRequestDto?> ScheduleTimeAsync(int id, ScheduleAppointmentTimeDto dto, CancellationToken ct = default);
}

public interface IAppointmentMessageService
{
    Task<IEnumerable<AppointmentMessageDto>> GetByAppointmentIdAsync(int appointmentId, CancellationToken ct = default);
    Task<IEnumerable<ConversationPreviewDto>> GetConversationsAsync(CancellationToken ct = default);
    Task<AppointmentMessageDto> CreateOwnerMessageAsync(int appointmentId, string content, CancellationToken ct = default);
    Task<AppointmentMessageDto> CreateClientMessageAsync(int appointmentId, string content, CancellationToken ct = default);
    Task<AppointmentMessageDto> CreateSystemMessageAsync(int appointmentId, string content, CancellationToken ct = default);
    Task MarkReadByOwnerAsync(int appointmentId, CancellationToken ct = default);
    Task MarkReadByClientAsync(int appointmentId, CancellationToken ct = default);
    Task<ClientChatDto?> GetClientChatAsync(string token, CancellationToken ct = default);
    Task<bool> IsTokenValidAsync(string token, CancellationToken ct = default);
}
