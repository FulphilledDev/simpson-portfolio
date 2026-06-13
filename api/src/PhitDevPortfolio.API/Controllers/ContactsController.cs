using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;

namespace PhitDevPortfolio.API.Controllers;

[Authorize]
[ApiController]
[Route("api/contacts")]
public class ContactsController(IContactService contacts) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await contacts.GetAllAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var result = await contacts.GetByIdAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateContactDto dto, CancellationToken ct)
    {
        var result = await contacts.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateContactDto dto, CancellationToken ct)
    {
        var result = await contacts.UpdateAsync(id, dto, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var deleted = await contacts.DeleteAsync(id, ct);
        return deleted ? NoContent() : NotFound();
    }

    // ── Save-as-contact from appointment ─────────────────────────────────────

    [HttpPost("from-appointment/{appointmentRequestId:int}")]
    public async Task<IActionResult> SaveFromAppointment(int appointmentRequestId, CancellationToken ct)
    {
        try
        {
            var result = await contacts.SaveFromAppointmentAsync(appointmentRequestId, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // ── Project associations ──────────────────────────────────────────────────

    [HttpGet("by-project/{projectId:int}")]
    public async Task<IActionResult> GetByProject(int projectId, CancellationToken ct) =>
        Ok(await contacts.GetByProjectAsync(projectId, ct));

    [HttpPost("{contactId:int}/projects/{projectId:int}")]
    public async Task<IActionResult> AssignToProject(int contactId, int projectId, CancellationToken ct)
    {
        await contacts.AssignToProjectAsync(contactId, projectId, ct);
        return NoContent();
    }

    [HttpDelete("{contactId:int}/projects/{projectId:int}")]
    public async Task<IActionResult> RemoveFromProject(int contactId, int projectId, CancellationToken ct)
    {
        await contacts.RemoveFromProjectAsync(contactId, projectId, ct);
        return NoContent();
    }
}
