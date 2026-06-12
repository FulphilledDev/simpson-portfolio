using PhitDevPortfolio.Application.DTOs;

namespace PhitDevPortfolio.Application.Interfaces;

public interface IAvailabilityService
{
    Task<IEnumerable<AvailabilitySlotDto>> GetAllAsync(bool publicOnly = false, CancellationToken ct = default);
    Task<AvailabilitySlotDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<AvailabilitySlotDto> CreateAsync(UpsertAvailabilitySlotDto dto, CancellationToken ct = default);
    Task<AvailabilitySlotDto?> UpdateAsync(int id, UpsertAvailabilitySlotDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}

public interface IBlockedSlotService
{
    Task<IEnumerable<BlockedSlotDto>> GetAllAsync(CancellationToken ct = default);
    Task<BlockedSlotDto> CreateAsync(UpsertBlockedSlotDto dto, CancellationToken ct = default);
    Task<BlockedSlotDto?> UpdateAsync(int id, UpsertBlockedSlotDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}
