using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;

namespace PhitDevPortfolio.API.Controllers;

[ApiController]
[Route("api/availability")]
public class AvailabilityController(IAvailabilityService availability) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await availability.GetAllAsync(publicOnly: true, ct));

    [Authorize]
    [HttpGet("admin")]
    public async Task<IActionResult> GetAllAdmin(CancellationToken ct) =>
        Ok(await availability.GetAllAsync(publicOnly: false, ct));

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertAvailabilitySlotDto dto, CancellationToken ct)
    {
        var result = await availability.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [Authorize]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var result = await availability.GetByIdAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [Authorize]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertAvailabilitySlotDto dto, CancellationToken ct)
    {
        var result = await availability.UpdateAsync(id, dto, ct);
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
