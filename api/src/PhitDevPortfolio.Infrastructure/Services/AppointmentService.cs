using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;
using PhitDevPortfolio.Application.Options;
using PhitDevPortfolio.Domain.Entities;
using PhitDevPortfolio.Domain.Enums;
using PhitDevPortfolio.Infrastructure.Persistence;

namespace PhitDevPortfolio.Infrastructure.Services;

public class AppointmentService(
    AppDbContext db,
    IEmailService email,
    IAppointmentMessageService messages,
    IGoogleCalendarService gcal,
    IAdminSettingsService adminSettings,
    ILogger<AppointmentService> logger) : IAppointmentService
{
    public async Task<IEnumerable<AppointmentRequestDto>> GetAllAsync(CancellationToken ct = default)
    {
        var items = await db.AppointmentRequests
            .AsNoTracking()
            .OrderByDescending(x => x.SubmittedAt)
            .ToListAsync(ct);
        return items.Select(ToDto);
    }

    public async Task<AppointmentRequestDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var item = await db.AppointmentRequests.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        return item is null ? null : ToDto(item);
    }

    public async Task<AppointmentRequestDto> CreateAsync(CreateAppointmentRequestDto dto, CancellationToken ct = default)
    {
        var entity = new AppointmentRequest
        {
            Name          = dto.Name,
            Email         = dto.Email,
            Phone         = dto.Phone,
            ProjectType   = dto.ProjectType,
            Budget        = dto.Budget,
            Message       = dto.Message,
            RequestedDate = dto.RequestedDate,
            RequestedTime = dto.RequestedTime,
            ClientToken   = Guid.NewGuid().ToString()
        };

        db.AppointmentRequests.Add(entity);
        await db.SaveChangesAsync(ct);

        var result = ToDto(entity);

        try { await email.SendOwnerNewAppointmentAsync(result, ct); }
        catch (Exception ex) { logger.LogError(ex, "Failed to send owner notification for appointment {Id}", entity.Id); }

        try { await messages.CreateSystemMessageAsync(entity.Id, "Your appointment request has been received. You'll be notified when the owner responds.", ct); }
        catch (Exception ex) { logger.LogError(ex, "Failed to create system message for appointment {Id}", entity.Id); }

        return result;
    }

    public async Task<AppointmentRequestDto?> RespondAsync(int id, RespondToAppointmentDto dto, CancellationToken ct = default)
    {
        var entity = await db.AppointmentRequests.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null) return null;

        entity.Status      = dto.Status;
        entity.OwnerNotes  = dto.OwnerNotes;
        entity.RespondedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);

        var result = ToDto(entity);

        // System message records the decision in the chat thread
        var systemMsg = dto.Status == AppointmentStatus.Accepted
            ? "Your appointment request has been accepted!"
            : "Your appointment request was not accepted at this time.";
        try { await messages.CreateSystemMessageAsync(id, systemMsg, ct); }
        catch (Exception ex) { logger.LogError(ex, "Failed to create system response message for appointment {Id}", id); }

        // If accepted and a date/time was requested, create a Google Calendar event
        if (dto.Status == AppointmentStatus.Accepted && entity.RequestedDate.HasValue && entity.RequestedTime.HasValue)
        {
            try
            {
                if (await gcal.IsAutoSyncEnabledAsync(ct))
                {
                    var settings = await adminSettings.GetAsync(ct);
                    var eventId  = await gcal.CreateAppointmentEventAsync(result, settings.AppointmentDurationMinutes, 0, ct);
                    if (eventId is not null)
                    {
                        entity.GoogleCalendarEventId = eventId;
                        await db.SaveChangesAsync(ct);
                    }
                }
            }
            catch (Exception ex) { logger.LogError(ex, "Failed to create Google Calendar event for appointment {Id}", id); }
        }

        // If the owner wrote a personal message, add it as an owner message
        if (!string.IsNullOrWhiteSpace(dto.ResponseMessage))
        {
            try { await messages.CreateOwnerMessageAsync(id, dto.ResponseMessage, ct); }
            catch (Exception ex) { logger.LogError(ex, "Failed to create owner message for appointment {Id}", id); }
        }

        try { await email.SendClientAppointmentResponseAsync(result, dto.ResponseMessage, ct); }
        catch (Exception ex) { logger.LogError(ex, "Failed to send client response email for appointment {Id}", id); }

        return result;
    }

    public async Task<AppointmentRequestDto?> ScheduleTimeAsync(int id, ScheduleAppointmentTimeDto dto, CancellationToken ct = default)
    {
        var entity = await db.AppointmentRequests.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null) return null;

        var isUpdate = entity.ScheduledDate.HasValue || entity.ScheduledTime.HasValue;
        var oldDate  = entity.ScheduledDate;
        var oldTime  = entity.ScheduledTime;

        entity.ScheduledDate = dto.Date;
        entity.ScheduledTime = dto.Time;
        await db.SaveChangesAsync(ct);

        var result = ToDto(entity);

        // Log time change as a system message in the chat thread
        var newDt  = $"{dto.Date:MMMM d, yyyy} at {dto.Time:h:mm tt}";
        var sysMsg = isUpdate && oldDate.HasValue && oldTime.HasValue
            ? $"Appointment time updated from {oldDate.Value:MMMM d, yyyy} at {oldTime.Value:h:mm tt} to {newDt}."
            : $"Appointment time set for {newDt}.";

        try { await messages.CreateSystemMessageAsync(id, sysMsg, ct); }
        catch (Exception ex) { logger.LogError(ex, "Failed to create schedule system message for appointment {Id}", id); }

        // Sync with Google Calendar (create new event or update existing)
        try
        {
            if (await gcal.IsAutoSyncEnabledAsync(ct))
            {
                var settings = await adminSettings.GetAsync(ct);
                if (isUpdate && entity.GoogleCalendarEventId is not null)
                {
                    await gcal.UpdateAppointmentEventAsync(entity.GoogleCalendarEventId, result, settings.AppointmentDurationMinutes, dto.UtcOffsetMinutes, ct);
                }
                else
                {
                    var eventId = await gcal.CreateAppointmentEventAsync(result, settings.AppointmentDurationMinutes, dto.UtcOffsetMinutes, ct);
                    if (eventId is not null)
                    {
                        entity.GoogleCalendarEventId = eventId;
                        await db.SaveChangesAsync(ct);
                        result = ToDto(entity);
                    }
                }
            }
        }
        catch (Exception ex) { logger.LogError(ex, "Failed to sync Google Calendar event for appointment {Id}", id); }

        // Email client with the scheduled time and a link to the chat
        try { await email.SendClientScheduledTimeAsync(result, dto.Date, dto.Time, isUpdate, ct); }
        catch (Exception ex) { logger.LogError(ex, "Failed to send schedule notification email for appointment {Id}", id); }

        return result;
    }

    internal static AppointmentRequestDto ToDto(AppointmentRequest e) => new(
        e.Id, e.Name, e.Email, e.Phone, e.ProjectType, e.Budget,
        e.Message, e.Status, e.SubmittedAt, e.RespondedAt, e.OwnerNotes, e.ClientToken,
        e.RequestedDate, e.RequestedTime, e.ScheduledDate, e.ScheduledTime);
}
