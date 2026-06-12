using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;
using PhitDevPortfolio.API.Hubs;

namespace PhitDevPortfolio.API.Controllers;

[ApiController]
[Route("api/appointments")]
public class AppointmentsController(
    IAppointmentService appointments,
    IAppointmentMessageService messages,
    IEmailService email,
    IHubContext<AppointmentChatHub> hub) : ControllerBase
{
    // ── Public ────────────────────────────────────────────────────────────────

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAppointmentRequestDto dto, CancellationToken ct)
    {
        var result = await appointments.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    // ── Admin auth ────────────────────────────────────────────────────────────

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await appointments.GetAllAsync(ct));

    [Authorize]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var result = await appointments.GetByIdAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [Authorize]
    [HttpPatch("{id:int}/respond")]
    public async Task<IActionResult> Respond(int id, [FromBody] RespondToAppointmentDto dto, CancellationToken ct)
    {
        var result = await appointments.RespondAsync(id, dto, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [Authorize]
    [HttpPatch("{id:int}/schedule")]
    public async Task<IActionResult> ScheduleTime(int id, [FromBody] ScheduleAppointmentTimeDto dto, CancellationToken ct)
    {
        var result = await appointments.ScheduleTimeAsync(id, dto, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [Authorize]
    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations(CancellationToken ct) =>
        Ok(await messages.GetConversationsAsync(ct));

    [Authorize]
    [HttpGet("{id:int}/messages")]
    public async Task<IActionResult> GetMessages(int id, CancellationToken ct) =>
        Ok(await messages.GetByAppointmentIdAsync(id, ct));

    [Authorize]
    [HttpPost("{id:int}/messages")]
    public async Task<IActionResult> SendOwnerMessage(int id, [FromBody] CreateAppointmentMessageDto dto, CancellationToken ct)
    {
        var msg = await messages.CreateOwnerMessageAsync(id, dto.Content, ct);
        await hub.Clients.Group(AppointmentChatHub.GroupName(id)).SendAsync("NewMessage", msg, ct);

        var appt = await appointments.GetByIdAsync(id, ct);
        if (appt is not null)
            _ = email.SendClientNewMessageNotificationAsync(appt, ct);

        return Ok(msg);
    }

    [Authorize]
    [HttpPatch("{id:int}/messages/read")]
    public async Task<IActionResult> MarkRead(int id, CancellationToken ct)
    {
        await messages.MarkReadByOwnerAsync(id, ct);
        return NoContent();
    }
}
