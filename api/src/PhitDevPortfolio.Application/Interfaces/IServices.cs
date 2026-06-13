using PhitDevPortfolio.Application.DTOs;

namespace PhitDevPortfolio.Application.Interfaces;

public interface IAdminSettingsService
{
    Task<AdminSettingsDto> GetAsync(CancellationToken ct = default);
    Task<AdminSettingsDto> UpdateAsync(UpdateAdminSettingsDto dto, CancellationToken ct = default);
    Task<AdminSettingsDto> UpdateProfilePhotoAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default);
}

public interface IResumeVersionService
{
    Task<IEnumerable<ResumeVersionDto>> GetAllAsync(CancellationToken ct = default);
    Task<ResumeVersionDto> UploadAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default);
    Task<ResumeVersionDto> SetActiveAsync(int id, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
    /// <summary>Returns a readable stream + metadata suitable for a file download response.</summary>
    Task<(Stream Stream, string FileName, string ContentType)> GetDownloadStreamAsync(int id, CancellationToken ct = default);
    Task SendByEmailAsync(int id, string toEmail, string toName, CancellationToken ct = default);
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
    Task<string?> CreateAppointmentEventAsync(AppointmentRequestDto appointment, int durationMinutes, int utcOffsetMinutes = 0, CancellationToken ct = default);
    Task UpdateAppointmentEventAsync(string googleEventId, AppointmentRequestDto appointment, int durationMinutes, int utcOffsetMinutes = 0, CancellationToken ct = default);
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
    Task SendClientScheduledTimeAsync(AppointmentRequestDto appointment, DateOnly newDate, TimeOnly newTime, bool isUpdate, CancellationToken ct = default);
    Task SendReviewRequestAsync(string reviewerEmail, string reviewerName, string reviewToken, CancellationToken ct = default);
    Task SendResumeAsync(string toEmail, string toName, string fileName, byte[] fileBytes, CancellationToken ct = default);
}

public interface IBlobStorageService
{
    /// <param name="isPublic">
    ///   Set to <c>true</c> for containers whose blobs are served via direct public URL
    ///   (e.g. project thumbnails, profile photos). Use <c>false</c> (default) for
    ///   private containers whose files are streamed through the API (e.g. resumes).
    /// </param>
    Task<string> UploadAsync(Stream stream, string fileName, string containerName, bool isPublic = false, CancellationToken ct = default);
    Task DeleteAsync(string blobUrl, string containerName, CancellationToken ct = default);
    Task<Stream> DownloadAsync(string blobUrl, string containerName, CancellationToken ct = default);
}
