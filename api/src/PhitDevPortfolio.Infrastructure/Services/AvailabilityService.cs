using Microsoft.EntityFrameworkCore;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;
using PhitDevPortfolio.Domain.Entities;
using PhitDevPortfolio.Infrastructure.Persistence;

namespace PhitDevPortfolio.Infrastructure.Services;

public class AvailabilityService(AppDbContext db, IGoogleCalendarService gcal) : IAvailabilityService
{
    public async Task<IEnumerable<AvailabilitySlotDto>> GetAllAsync(bool publicOnly = false, CancellationToken ct = default)
    {
        var query = db.AvailabilitySlots.AsNoTracking();
        if (publicOnly) query = query.Where(s => s.IsPublic);
        var items = await query.OrderBy(s => s.Date).ThenBy(s => s.StartTime).ToListAsync(ct);
        return items.Select(ToDto);
    }

    public async Task<AvailabilitySlotDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var item = await db.AvailabilitySlots.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id, ct);
        return item is null ? null : ToDto(item);
    }

    public async Task<AvailabilitySlotDto> CreateAsync(UpsertAvailabilitySlotDto dto, CancellationToken ct = default)
    {
        var entity = Map(new AvailabilitySlot(), dto);
        db.AvailabilitySlots.Add(entity);
        await db.SaveChangesAsync(ct);

        if (await gcal.IsAutoSyncEnabledAsync(ct))
        {
            try { await gcal.SyncSlotAsync(entity.Id, ct); }
            catch { /* sync failure is non-fatal */ }
        }

        return ToDto(entity);
    }

    public async Task<AvailabilitySlotDto?> UpdateAsync(int id, UpsertAvailabilitySlotDto dto, CancellationToken ct = default)
    {
        var entity = await db.AvailabilitySlots.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (entity is null) return null;

        Map(entity, dto);
        await db.SaveChangesAsync(ct);

        if (await gcal.IsAutoSyncEnabledAsync(ct))
        {
            try { await gcal.SyncSlotAsync(entity.Id, ct); }
            catch { /* sync failure is non-fatal */ }
        }

        return ToDto(entity);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await db.AvailabilitySlots.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (entity is null) return false;

        if (!string.IsNullOrEmpty(entity.GoogleCalendarEventId))
        {
            try { await gcal.DeleteEventAsync(entity.GoogleCalendarEventId, ct); }
            catch { /* non-fatal */ }
        }

        db.AvailabilitySlots.Remove(entity);
        await db.SaveChangesAsync(ct);
        return true;
    }

    private static AvailabilitySlot Map(AvailabilitySlot entity, UpsertAvailabilitySlotDto dto)
    {
        entity.Title                = dto.Title;
        entity.Date                 = dto.Date;
        entity.StartTime            = dto.StartTime;
        entity.EndTime              = dto.EndTime;
        entity.Type                 = dto.Type;
        entity.IsPublic             = dto.IsPublic;
        entity.Notes                = dto.Notes;
        entity.AppointmentRequestId = dto.AppointmentRequestId;
        return entity;
    }

    private static AvailabilitySlotDto ToDto(AvailabilitySlot s) =>
        new(s.Id, s.Title, s.Date, s.StartTime, s.EndTime, s.Type, s.IsPublic, s.Notes, s.AppointmentRequestId);
}

public class BlockedSlotService(AppDbContext db) : IBlockedSlotService
{
    public async Task<IEnumerable<BlockedSlotDto>> GetAllAsync(CancellationToken ct = default)
    {
        var items = await db.BlockedSlots.AsNoTracking().OrderBy(s => s.Start).ToListAsync(ct);
        return items.Select(ToDto);
    }

    public async Task<BlockedSlotDto> CreateAsync(UpsertBlockedSlotDto dto, CancellationToken ct = default)
    {
        var entity = new BlockedSlot { Start = dto.Start, End = dto.End, Reason = dto.Reason };
        db.BlockedSlots.Add(entity);
        await db.SaveChangesAsync(ct);
        return ToDto(entity);
    }

    public async Task<BlockedSlotDto?> UpdateAsync(int id, UpsertBlockedSlotDto dto, CancellationToken ct = default)
    {
        var entity = await db.BlockedSlots.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (entity is null) return null;
        entity.Start  = dto.Start;
        entity.End    = dto.End;
        entity.Reason = dto.Reason;
        await db.SaveChangesAsync(ct);
        return ToDto(entity);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await db.BlockedSlots.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (entity is null) return false;
        db.BlockedSlots.Remove(entity);
        await db.SaveChangesAsync(ct);
        return true;
    }

    private static BlockedSlotDto ToDto(BlockedSlot s) => new(s.Id, s.Start, s.End, s.Reason);
}
