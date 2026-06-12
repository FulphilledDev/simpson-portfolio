using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using PhitDevPortfolio.Application.Interfaces;
using PhitDevPortfolio.Application.Options;

namespace PhitDevPortfolio.API.Controllers;

[ApiController]
[Route("api/googlecalendar")]
[Authorize]
public class GoogleCalendarController(
    IGoogleCalendarService gcal,
    IOptions<GoogleOptions> options) : ControllerBase
{
    private readonly GoogleOptions _opts = options.Value;
    [HttpGet("status")]
    public async Task<IActionResult> Status(CancellationToken ct) =>
        Ok(await gcal.GetStatusAsync(ct));

    [HttpGet("connect")]
    public async Task<IActionResult> Connect(CancellationToken ct)
    {
        var url = await gcal.GetAuthUrlAsync(ct);
        return Redirect(url);
    }

    [AllowAnonymous]
    [HttpGet("callback")]
    public async Task<IActionResult> Callback([FromQuery] string code, CancellationToken ct)
    {
        await gcal.ConnectAsync(code, ct);
        return Redirect($"{_opts.FrontendBaseUrl}/admin/settings?gcal=connected");
    }

    [HttpDelete("disconnect")]
    public async Task<IActionResult> Disconnect(CancellationToken ct)
    {
        await gcal.DisconnectAsync(ct);
        return NoContent();
    }

    [HttpPatch("autosync")]
    public async Task<IActionResult> SetAutoSync([FromBody] bool enabled, CancellationToken ct)
    {
        await gcal.SetAutoSyncAsync(enabled, ct);
        return NoContent();
    }
}
