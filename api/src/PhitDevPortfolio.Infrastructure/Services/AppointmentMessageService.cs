using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;
using PhitDevPortfolio.Application.Options;
using PhitDevPortfolio.Domain.Entities;
using PhitDevPortfolio.Domain.Enums;
using PhitDevPortfolio.Infrastructure.Persistence;

namespace PhitDevPortfolio.Infrastructure.Services;

public class AppointmentMessageService(
    AppDbContext db,
    IEmailService email,
    IOptions<EmailOptions> emailOptions) : IAppointmentMessageService
{
    private readonly string _appBaseUrl = emailOptions.Value.AppBaseUrl.TrimEnd('/');

    // ── Token validation ─────────────────────────────────────────────────────

    public async Task<bool> IsTokenValidAsync(string token, CancellationToken ct = default)
    {
        var appt = await db.AppointmentRequests
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.ClientToken == token, ct);
        return appt is not null && IsTokenValid(appt);
    }

    private static bool IsTokenValid(AppointmentRequest appt)
    {
        var now = DateTimeOffset.UtcNow;
        return appt.Status switch
        {
            AppointmentStatus.Accepted => now <= appt.SubmittedAt.AddDays(120),
            AppointmentStatus.Denied   => appt.RespondedAt.HasValue && now <= appt.RespondedAt.Value.AddDays(60),
            _                          => now <= appt.SubmittedAt.AddDays(90)
        };
    }

    // ── Queries ──────────────────────────────────────────────────────────────

    public async Task<IEnumerable<AppointmentMessageDto>> GetByAppointmentIdAsync(int appointmentId, CancellationToken ct = default)
    {
        return await db.AppointmentMessages
            .AsNoTracking()
            .Where(m => m.AppointmentRequestId == appointmentId)
            .OrderBy(m => m.SentAt)
            .Select(m => ToDto(m))
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<ConversationPreviewDto>> GetConversationsAsync(CancellationToken ct = default)
    {
        var groups = await db.AppointmentMessages
            .AsNoTracking()
            .GroupBy(m => m.AppointmentRequestId)
            .Select(g => new
            {
                AppointmentRequestId = g.Key,
                LastMessageAt        = g.Max(m => m.SentAt),
                LastMessage          = g.OrderByDescending(m => m.SentAt).First(),
                OwnerUnread          = g.Count(m => m.Sender == MessageSender.Client && !m.IsReadByOwner),
                ClientUnread         = g.Count(m => m.Sender != MessageSender.Client && !m.IsReadByClient)
            })
            .OrderByDescending(g => g.LastMessageAt)
            .ToListAsync(ct);

        if (groups.Count == 0) return [];

        var ids      = groups.Select(g => g.AppointmentRequestId).ToList();
        var appts    = await db.AppointmentRequests.AsNoTracking()
                               .Where(a => ids.Contains(a.Id))
                               .ToDictionaryAsync(a => a.Id, ct);

        return groups
            .Where(g => appts.ContainsKey(g.AppointmentRequestId))
            .Select(g =>
            {
                var a = appts[g.AppointmentRequestId];
                return new ConversationPreviewDto(
                    g.AppointmentRequestId, a.Name, a.Email, a.Status,
                    g.LastMessage.Content, g.LastMessageAt, g.OwnerUnread, g.ClientUnread);
            });
    }

    public async Task<ClientChatDto?> GetClientChatAsync(string token, CancellationToken ct = default)
    {
        var appt = await db.AppointmentRequests
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.ClientToken == token, ct);

        if (appt is null) return null;

        var isValid = IsTokenValid(appt);
        var msgs    = isValid
            ? await db.AppointmentMessages.AsNoTracking()
                      .Where(m => m.AppointmentRequestId == appt.Id)
                      .OrderBy(m => m.SentAt)
                      .Select(m => ToDto(m))
                      .ToListAsync(ct)
            : [];

        return new ClientChatDto(appt.Id, appt.Name, appt.Status, isValid, msgs);
    }

    // ── Mutations ────────────────────────────────────────────────────────────

    public async Task<AppointmentMessageDto> CreateOwnerMessageAsync(int appointmentId, string content, CancellationToken ct = default)
    {
        var msg = new AppointmentMessage
        {
            AppointmentRequestId = appointmentId,
            Sender               = MessageSender.Owner,
            Content              = content,
            IsReadByOwner        = true,
            IsReadByClient       = false
        };
        db.AppointmentMessages.Add(msg);
        await db.SaveChangesAsync(ct);
        return ToDto(msg);
    }

    public async Task<AppointmentMessageDto> CreateClientMessageAsync(int appointmentId, string content, CancellationToken ct = default)
    {
        var msg = new AppointmentMessage
        {
            AppointmentRequestId = appointmentId,
            Sender               = MessageSender.Client,
            Content              = content,
            IsReadByOwner        = false,
            IsReadByClient       = true
        };
        db.AppointmentMessages.Add(msg);
        await db.SaveChangesAsync(ct);
        return ToDto(msg);
    }

    public async Task<AppointmentMessageDto> CreateSystemMessageAsync(int appointmentId, string content, CancellationToken ct = default)
    {
        var msg = new AppointmentMessage
        {
            AppointmentRequestId = appointmentId,
            Sender               = MessageSender.System,
            Content              = content,
            IsReadByOwner        = true,
            IsReadByClient       = false
        };
        db.AppointmentMessages.Add(msg);
        await db.SaveChangesAsync(ct);
        return ToDto(msg);
    }

    public async Task MarkReadByOwnerAsync(int appointmentId, CancellationToken ct = default)
    {
        await db.AppointmentMessages
            .Where(m => m.AppointmentRequestId == appointmentId
                     && m.Sender == MessageSender.Client
                     && !m.IsReadByOwner)
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.IsReadByOwner, true), ct);
    }

    public async Task MarkReadByClientAsync(int appointmentId, CancellationToken ct = default)
    {
        await db.AppointmentMessages
            .Where(m => m.AppointmentRequestId == appointmentId
                     && m.Sender != MessageSender.Client
                     && !m.IsReadByClient)
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.IsReadByClient, true), ct);
    }

    private static AppointmentMessageDto ToDto(AppointmentMessage m) => new(
        m.Id, m.AppointmentRequestId, m.Sender, m.Content, m.SentAt, m.IsReadByOwner, m.IsReadByClient);
}
