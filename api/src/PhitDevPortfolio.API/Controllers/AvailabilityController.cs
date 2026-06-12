using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;

namespace PhitDevPortfolio.API.Controllers;

[ApiController]
[Route("api/availability")]
public class AvailabilityController(IWeeklyAvailabilityService availability) : ControllerBase
{
    /// <summary>Get the owner's weekly availability schedule (public).</summary>
    [HttpGet("schedule")]
    public async Task<IActionResult> GetSchedule(CancellationToken ct) =>
        Ok(await availability.GetAllAsync(ct));

    /// <summary>
    /// Get available start times for a specific date (public).
    /// Respects weekly availability rules and blocked periods.
    /// </summary>
    [HttpGet("slots")]
    public async Task<IActionResult> GetSlotsForDate([FromQuery] string date, CancellationToken ct)
    {
        if (!DateOnly.TryParse(date, out var parsed))
            return BadRequest("Invalid date format. Use yyyy-MM-dd.");
        return Ok(await availability.GetAvailableTimesForDateAsync(parsed, ct));
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] UpsertWeeklyAvailabilityDto dto, CancellationToken ct) =>
        Ok(await availability.UpsertAsync(dto, ct));

    [Authorize]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var result = await availability.GetByIdAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var deleted = await availability.DeleteAsync(id, ct);
        return deleted ? NoContent() : NotFound();
    }
}

[ApiController]
[Route("api/blockedslots")]
public class BlockedSlotsController(IBlockedSlotService blockedSlots) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await blockedSlots.GetAllAsync(ct));

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertBlockedSlotDto dto, CancellationToken ct) =>
        Ok(await blockedSlots.CreateAsync(dto, ct));

    [Authorize]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertBlockedSlotDto dto, CancellationToken ct)
    {
        var result = await blockedSlots.UpdateAsync(id, dto, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var deleted = await blockedSlots.DeleteAsync(id, ct);
        return deleted ? NoContent() : NotFound();
    }
}
