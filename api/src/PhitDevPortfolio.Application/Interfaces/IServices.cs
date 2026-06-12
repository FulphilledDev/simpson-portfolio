using PhitDevPortfolio.Application.DTOs;

namespace PhitDevPortfolio.Application.Interfaces;

public interface IAdminSettingsService
{
    Task<AdminSettingsDto> GetAsync(CancellationToken ct = default);
    Task<AdminSettingsDto> UpdateAsync(UpdateAdminSettingsDto dto, CancellationToken ct = default);
    Task<AdminSettingsDto> UpdateProfilePhotoAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default);
}

public interface ITokenService
{
    Task<AuthResultDto?> ValidateGoogleTokenAsync(string idToken, CancellationToken ct = default);
}

public interface IGoogleCalendarService
{
    Task<GoogleCalendarStatusDto> GetStatusAsync(CancellationToken ct = default);
    Task<string> GetAuthUrlAsync(CancellationToken ct = default);
    Task ConnectAsync(string authCode, CancellationToken ct = default);
    Task DisconnectAsync(CancellationToken ct = default);
    Task SyncSlotAsync(int slotId, CancellationToken ct = default);
    Task DeleteEventAsync(string googleEventId, CancellationToken ct = default);
    Task<bool> IsAutoSyncEnabledAsync(CancellationToken ct = default);
    Task SetAutoSyncAsync(bool enabled, CancellationToken ct = default);
}

public interface IEmailService
{
    Task SendOwnerNewAppointmentAsync(AppointmentRequestDto appointment, CancellationToken ct = default);
    Task SendClientAppointmentResponseAsync(AppointmentRequestDto appointment, string? responseMessage, CancellationToken ct = default);
    Task SendOwnerNewMessageNotificationAsync(AppointmentRequestDto appointment, CancellationToken ct = default);
    Task SendClientNewMessageNotificationAsync(AppointmentRequestDto appointment, CancellationToken ct = default);
    Task SendReviewRequestAsync(string reviewerEmail, string reviewerName, string reviewToken, CancellationToken ct = default);
}

public interface IBlobStorageService
{
    Task<string> UploadAsync(Stream stream, string fileName, string containerName, CancellationToken ct = default);
    Task DeleteAsync(string blobUrl, string containerName, CancellationToken ct = default);
}
