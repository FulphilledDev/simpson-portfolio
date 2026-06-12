using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;
using PhitDevPortfolio.API.Hubs;

namespace PhitDevPortfolio.API.Controllers;

/// <summary>Public tokenized chat endpoint for appointment clients (no auth required).</summary>
[ApiController]
[Route("api/appointments/chat")]
public class AppointmentChatController(
    IAppointmentMessageService messages,
    IAppointmentService appointments,
    IEmailService email,
    IHubContext<AppointmentChatHub> hub) : ControllerBase
{
    [HttpGet("{token}")]
    public async Task<IActionResult> GetChat(string token, CancellationToken ct)
    {
        var chat = await messages.GetClientChatAsync(token, ct);
        if (chat is null) return NotFound();
        if (!chat.IsTokenValid) return StatusCode(410, new { message = "This chat link has expired." });
        return Ok(chat);
    }

    [HttpPost("{token}/messages")]
    public async Task<IActionResult> SendClientMessage(string token, [FromBody] CreateAppointmentMessageDto dto, CancellationToken ct)
    {
        if (!await messages.IsTokenValidAsync(token, ct))
            return StatusCode(410, new { message = "This chat link has expired." });

        var chat = await messages.GetClientChatAsync(token, ct);
        if (chat is null) return NotFound();

        var msg = await messages.CreateClientMessageAsync(chat.AppointmentRequestId, dto.Content, ct);
        await hub.Clients
            .Group(AppointmentChatHub.GroupName(chat.AppointmentRequestId))
            .SendAsync("NewMessage", msg, ct);

        await messages.MarkReadByClientAsync(chat.AppointmentRequestId, ct);

        var appt = await appointments.GetByIdAsync(chat.AppointmentRequestId, ct);
        if (appt is not null)
            _ = email.SendOwnerNewMessageNotificationAsync(appt, ct);

        return Ok(msg);
    }
}
