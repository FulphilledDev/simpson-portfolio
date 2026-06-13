using Microsoft.EntityFrameworkCore;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;
using PhitDevPortfolio.Domain.Entities;
using PhitDevPortfolio.Infrastructure.Persistence;

namespace PhitDevPortfolio.Infrastructure.Services;

public class WeeklyAvailabilityService(AppDbContext db) : IWeeklyAvailabilityService
{
    public async Task<IEnumerable<WeeklyAvailabilityDto>> GetAllAsync(CancellationToken ct = default)
    {
        var items = await db.WeeklyAvailabilities.AsNoTracking()
            .OrderBy(w => w.DayOfWeek)
            .ToListAsync(ct);
        return items.Select(ToDto);
    }

    public async Task<WeeklyAvailabilityDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var item = await db.WeeklyAvailabilities.AsNoTracking().FirstOrDefaultAsync(w => w.Id == id, ct);
        return item is null ? null : ToDto(item);
    }

    public async Task<WeeklyAvailabilityDto> UpsertAsync(UpsertWeeklyAvailabilityDto dto, CancellationToken ct = default)
    {
        var entity = await db.WeeklyAvailabilities.FirstOrDefaultAsync(w => w.DayOfWeek == dto.DayOfWeek, ct);
        if (entity is null)
        {
            entity = new WeeklyAvailability();
            db.WeeklyAvailabilities.Add(entity);
        }

        entity.DayOfWeek = dto.DayOfWeek;
        entity.StartTime = dto.StartTime;
        entity.EndTime   = dto.EndTime;
        entity.IsEnabled = dto.IsEnabled;
        await db.SaveChangesAsync(ct);
        return ToDto(entity);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await db.WeeklyAvailabilities.FirstOrDefaultAsync(w => w.Id == id, ct);
        if (entity is null) return false;
        db.WeeklyAvailabilities.Remove(entity);
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<DayAvailabilityDto> GetAvailableTimesForDateAsync(DateOnly date, CancellationToken ct = default)
    {
        var dayOfWeek = date.DayOfWeek;

        var rule = await db.WeeklyAvailabilities
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.DayOfWeek == dayOfWeek && w.IsEnabled, ct);

        var settings = await db.AdminSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Id == 1, ct);
        var durationMinutes = settings?.AppointmentDurationMinutes ?? 30;

        TimeOnly windowStart;
        TimeOnly windowEnd;

        if (rule is null)
        {
            // If any rules are configured, this day is simply unavailable.
            // If no rules exist at all, treat every day as open (8 AM – 6 PM).
            var hasAnyRules = await db.WeeklyAvailabilities.AnyAsync(w => w.IsEnabled, ct);
            if (hasAnyRules)
                return new DayAvailabilityDto(false, Array.Empty<string>());

            windowStart = new TimeOnly(8, 0);
            windowEnd   = new TimeOnly(18, 0);
        }
        else
        {
            windowStart = rule.StartTime;
            windowEnd   = rule.EndTime;
        }

        var dayStart = new DateTimeOffset(date.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
        var dayEnd   = new DateTimeOffset(date.ToDateTime(TimeOnly.MaxValue), TimeSpan.Zero);
        var blocked  = await db.BlockedSlots
            .AsNoTracking()
            .Where(b => b.Start < dayEnd && b.End > dayStart)
            .ToListAsync(ct);

        var startTimes = new List<string>();
        var cursor = windowStart;
        var lastSlotStart = windowEnd.AddMinutes(-durationMinutes);

        while (cursor <= lastSlotStart)
        {
            var slotStart = new DateTimeOffset(date.ToDateTime(cursor), TimeSpan.Zero);
            var slotEnd   = slotStart.AddMinutes(durationMinutes);
            if (!blocked.Any(b => b.Start < slotEnd && b.End > slotStart))
                startTimes.Add(cursor.ToString("HH:mm"));
            cursor = cursor.AddMinutes(durationMinutes);
        }

        return new DayAvailabilityDto(startTimes.Count > 0, startTimes);
    }

    private static WeeklyAvailabilityDto ToDto(WeeklyAvailability w) =>
        new(w.Id, w.DayOfWeek, w.StartTime, w.EndTime, w.IsEnabled);
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

    private static BlockedSlotDto ToDto(BlockedSlot s) =>
        new(s.Id, s.Start, s.End, s.Reason);
}