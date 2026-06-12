using Google.Apis.Auth.OAuth2;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;
using PhitDevPortfolio.Application.Options;
using PhitDevPortfolio.Domain.Entities;
using PhitDevPortfolio.Infrastructure.Persistence;
using System.Text.Json;

namespace PhitDevPortfolio.Infrastructure.Services;

public class GoogleCalendarService(
    AppDbContext db,
    IOptions<GoogleOptions> options,
    IHttpClientFactory httpFactory,
    ILogger<GoogleCalendarService> logger) : IGoogleCalendarService
{
    private readonly GoogleOptions _opts = options.Value;
    private const string TokenEndpoint  = "https://oauth2.googleapis.com/token";
    private const string CalendarScope  = "https://www.googleapis.com/auth/calendar.events";

    public async Task<GoogleCalendarStatusDto> GetStatusAsync(CancellationToken ct = default)
    {
        var conn = await GetConnectionAsync(ct);
        return new GoogleCalendarStatusDto(
            conn?.IsActive == true,
            conn?.ConnectedEmail,
            conn?.CalendarId,
            conn?.TokenExpiresAt,
            conn?.AutoSync ?? true);
    }

    public async Task<string> GetAuthUrlAsync(CancellationToken ct = default)
    {
        return "https://accounts.google.com/o/oauth2/v2/auth" +
            $"?client_id={Uri.EscapeDataString(_opts.ClientId)}" +
            $"&redirect_uri={Uri.EscapeDataString(_opts.RedirectUri)}" +
            $"&response_type=code&scope={Uri.EscapeDataString(CalendarScope)}" +
            $"&access_type=offline&prompt=consent";
    }

    public async Task ConnectAsync(string authCode, CancellationToken ct = default)
    {
        var http = httpFactory.CreateClient();
        var body = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["code"]          = authCode,
            ["client_id"]     = _opts.ClientId,
            ["client_secret"] = _opts.ClientSecret,
            ["redirect_uri"]  = _opts.RedirectUri,
            ["grant_type"]    = "authorization_code"
        });

        var response = await http.PostAsync(TokenEndpoint, body, ct);
        var json     = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Google token exchange failed: {json}");

        using var doc         = JsonDocument.Parse(json);
        var root              = doc.RootElement;
        var accessToken       = root.GetProperty("access_token").GetString()!;
        var refreshToken      = root.TryGetProperty("refresh_token", out var rt) ? rt.GetString()! : string.Empty;
        var expiresIn         = root.TryGetProperty("expires_in", out var ex) ? ex.GetInt32() : 3600;
        var connectedEmail    = await FetchConnectedEmailAsync(accessToken, ct);

        var conn = await GetConnectionAsync(ct);
        if (conn is null) { conn = new GoogleCalendarConnection(); db.GoogleCalendarConnections.Add(conn); }

        conn.AccessToken    = accessToken;
        conn.RefreshToken   = refreshToken;
        conn.TokenExpiresAt = DateTimeOffset.UtcNow.AddSeconds(expiresIn - 60);
        conn.ConnectedEmail = connectedEmail;
        conn.ConnectedAt    = DateTimeOffset.UtcNow;
        conn.IsActive       = true;
        await db.SaveChangesAsync(ct);
    }

    public async Task DisconnectAsync(CancellationToken ct = default)
    {
        var conn = await GetConnectionAsync(ct);
        if (conn is null) return;
        conn.IsActive = false;
        await db.SaveChangesAsync(ct);
    }

    public async Task<bool> IsAutoSyncEnabledAsync(CancellationToken ct = default)
    {
        var conn = await GetConnectionAsync(ct);
        return conn?.IsActive == true && conn.AutoSync;
    }

    public async Task SetAutoSyncAsync(bool enabled, CancellationToken ct = default)
    {
        var conn = await GetConnectionAsync(ct);
        if (conn is null || !conn.IsActive) return;
        conn.AutoSync = enabled;
        await db.SaveChangesAsync(ct);
    }

    public async Task<string?> CreateAppointmentEventAsync(AppointmentRequestDto appointment, int durationMinutes, int utcOffsetMinutes = 0, CancellationToken ct = default)
    {
        // Prefer the owner-confirmed scheduled time; fall back to the client's requested time
        var date = appointment.ScheduledDate ?? appointment.RequestedDate;
        var time = appointment.ScheduledTime ?? appointment.RequestedTime;

        if (!date.HasValue || !time.HasValue)
            return null;

        var service = await GetCalendarServiceAsync(ct);
        if (service is null) return null;

        var startOffset = new DateTimeOffset(
            date.Value.ToDateTime(time.Value),
            TimeSpan.FromMinutes(utcOffsetMinutes));

        var calEvent = new Event
        {
            Summary     = $"Consultation: {appointment.Name}",
            Description = $"Project type: {appointment.ProjectType}\nEmail: {appointment.Email}\nPhone: {appointment.Phone ?? "—"}\n\n{appointment.Message}",
            Start       = new EventDateTime { DateTimeDateTimeOffset = startOffset },
            End         = new EventDateTime { DateTimeDateTimeOffset = startOffset.AddMinutes(durationMinutes) }
        };

        var created = await service.Events.Insert(calEvent, "primary").ExecuteAsync(ct);
        return created.Id;
    }

    public async Task UpdateAppointmentEventAsync(string googleEventId, AppointmentRequestDto appointment, int durationMinutes, int utcOffsetMinutes = 0, CancellationToken ct = default)
    {
        if (!appointment.ScheduledDate.HasValue || !appointment.ScheduledTime.HasValue)
            return;

        var service = await GetCalendarServiceAsync(ct);
        if (service is null) return;

        var startOffset = new DateTimeOffset(
            appointment.ScheduledDate.Value.ToDateTime(appointment.ScheduledTime.Value),
            TimeSpan.FromMinutes(utcOffsetMinutes));

        var calEvent = new Event
        {
            Summary     = $"Consultation: {appointment.Name}",
            Description = $"Project type: {appointment.ProjectType}\nEmail: {appointment.Email}\nPhone: {appointment.Phone ?? "—"}\n\n{appointment.Message}",
            Start       = new EventDateTime { DateTimeDateTimeOffset = startOffset },
            End         = new EventDateTime { DateTimeDateTimeOffset = startOffset.AddMinutes(durationMinutes) }
        };

        try { await service.Events.Update(calEvent, "primary", googleEventId).ExecuteAsync(ct); }
        catch (Exception ex) { logger.LogWarning(ex, "Failed to update Google Calendar event {Id}", googleEventId); }
    }

    public async Task DeleteEventAsync(string googleEventId, CancellationToken ct = default)
    {
        var service = await GetCalendarServiceAsync(ct);
        if (service is null) return;
        try { await service.Events.Delete("primary", googleEventId).ExecuteAsync(ct); }
        catch (Exception ex) { logger.LogWarning(ex, "Failed to delete Google Calendar event {Id}", googleEventId); }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private async Task<GoogleCalendarConnection?> GetConnectionAsync(CancellationToken ct) =>
        await db.GoogleCalendarConnections.FirstOrDefaultAsync(c => c.IsActive, ct);

    private async Task<CalendarService?> GetCalendarServiceAsync(CancellationToken ct)
    {
        var conn = await GetConnectionAsync(ct);
        if (conn is null) return null;

        if (conn.TokenExpiresAt <= DateTimeOffset.UtcNow.AddMinutes(5))
            await RefreshTokenAsync(conn, ct);

        var credential = GoogleCredential.FromAccessToken(conn.AccessToken);
        return new CalendarService(new BaseClientService.Initializer { HttpClientInitializer = credential });
    }

    private async Task RefreshTokenAsync(GoogleCalendarConnection conn, CancellationToken ct)
    {
        var http = httpFactory.CreateClient();
        var body = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"]     = _opts.ClientId,
            ["client_secret"] = _opts.ClientSecret,
            ["refresh_token"] = conn.RefreshToken,
            ["grant_type"]    = "refresh_token"
        });

        var response = await http.PostAsync(TokenEndpoint, body, ct);
        var json     = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogError("Google token refresh failed: {Json}", json);
            return;
        }

        using var doc   = JsonDocument.Parse(json);
        var root        = doc.RootElement;
        conn.AccessToken    = root.GetProperty("access_token").GetString()!;
        conn.TokenExpiresAt = DateTimeOffset.UtcNow.AddSeconds(root.TryGetProperty("expires_in", out var ex) ? ex.GetInt32() - 60 : 3540);
        await db.SaveChangesAsync(ct);
    }

    private async Task<string> FetchConnectedEmailAsync(string accessToken, CancellationToken ct)
    {
        var http = httpFactory.CreateClient();
        http.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
        var response = await http.GetAsync("https://www.googleapis.com/oauth2/v2/userinfo", ct);
        var json     = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement.TryGetProperty("email", out var email) ? email.GetString() ?? "unknown" : "unknown";
    }
}
