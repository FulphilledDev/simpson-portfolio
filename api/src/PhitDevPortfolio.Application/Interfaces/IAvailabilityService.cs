using PhitDevPortfolio.Application.DTOs;

namespace PhitDevPortfolio.Application.Interfaces;

public interface IWeeklyAvailabilityService
{
    Task<IEnumerable<WeeklyAvailabilityDto>> GetAllAsync(CancellationToken ct = default);
    Task<WeeklyAvailabilityDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<WeeklyAvailabilityDto> UpsertAsync(UpsertWeeklyAvailabilityDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);

    /// <summary>
    /// Returns available start times ("HH:mm") for the given date, respecting weekly
    /// availability rules and blocked periods. Uses AppointmentDurationMinutes from settings.
    /// </summary>
    Task<DayAvailabilityDto> GetAvailableTimesForDateAsync(DateOnly date, CancellationToken ct = default);
}

public interface IBlockedSlotService
{
    Task<IEnumerable<BlockedSlotDto>> GetAllAsync(CancellationToken ct = default);
    Task<BlockedSlotDto> CreateAsync(UpsertBlockedSlotDto dto, CancellationToken ct = default);
    Task<BlockedSlotDto?> UpdateAsync(int id, UpsertBlockedSlotDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}
