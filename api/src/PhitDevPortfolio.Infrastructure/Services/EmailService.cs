using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;
using PhitDevPortfolio.Application.Options;

namespace PhitDevPortfolio.Infrastructure.Services;

public class EmailService(IOptions<EmailOptions> options, ILogger<EmailService> logger) : IEmailService
{
    private readonly EmailOptions _opts = options.Value;

    public async Task SendOwnerNewAppointmentAsync(AppointmentRequestDto appt, CancellationToken ct = default)
    {
        var subject = $"New Appointment Request from {appt.Name}";
        var body    = BuildOwnerNewAppointmentHtml(appt);
        await SendAsync(_opts.OwnerEmail, "Portfolio Owner", subject, body, ct);
    }

    public async Task SendClientAppointmentResponseAsync(AppointmentRequestDto appt, string? responseMessage, CancellationToken ct = default)
    {
        var accepted = appt.Status == Domain.Enums.AppointmentStatus.Accepted;
        var subject  = accepted ? "Your appointment request was accepted!" : "Update on your appointment request";
        var chatUrl  = $"{_opts.AppBaseUrl}/appointments/chat/{appt.ClientToken}";
        var body     = BuildClientResponseHtml(appt, accepted, responseMessage, chatUrl);
        await SendAsync(appt.Email, appt.Name, subject, body, ct);
    }

    public async Task SendOwnerNewMessageNotificationAsync(AppointmentRequestDto appt, CancellationToken ct = default)
    {
        var subject = $"New message from {appt.Name}";
        var adminUrl = $"{_opts.AppBaseUrl}/admin/appointments/{appt.Id}";
        var body    = BuildSimpleNotificationHtml($"New message from {Encode(appt.Name)}", $"<a href=\"{adminUrl}\">View conversation</a>");
        await SendAsync(_opts.OwnerEmail, "Portfolio Owner", subject, body, ct);
    }

    public async Task SendClientNewMessageNotificationAsync(AppointmentRequestDto appt, CancellationToken ct = default)
    {
        var subject = "You have a new message";
        var chatUrl = $"{_opts.AppBaseUrl}/appointments/chat/{appt.ClientToken}";
        var body    = BuildSimpleNotificationHtml("You have a new message", $"<a href=\"{chatUrl}\">View message</a>");
        await SendAsync(appt.Email, appt.Name, subject, body, ct);
    }

    public async Task SendReviewRequestAsync(string reviewerEmail, string reviewerName, string reviewToken, CancellationToken ct = default)
    {
        var subject    = "You've been invited to leave a review";
        var submitUrl  = $"{_opts.AppBaseUrl}/reviews/submit/{reviewToken}";
        var body       = BuildReviewRequestHtml(reviewerName, submitUrl);
        await SendAsync(reviewerEmail, reviewerName, subject, body, ct);
    }

    // ── HTML builders ────────────────────────────────────────────────────────

    private string BuildOwnerNewAppointmentHtml(AppointmentRequestDto appt) => $@"
        {Styles()}
        <div class=""wrapper"">
          <div class=""header""><h1>New Appointment Request</h1></div>
          <div class=""body"">
            <p><strong>From:</strong> {Encode(appt.Name)} ({Encode(appt.Email)})</p>
            <p><strong>Project Type:</strong> {appt.ProjectType}</p>
            <p><strong>Budget:</strong> {Encode(appt.Budget ?? "Not specified")}</p>
            <div class=""message-box"">{Encode(appt.Message)}</div>
            <p><a href=""{_opts.AppBaseUrl}/admin/appointments/{appt.Id}"" class=""btn"">View Request</a></p>
          </div>
          {Footer()}
        </div>";

    private string BuildClientResponseHtml(AppointmentRequestDto appt, bool accepted, string? responseMessage, string chatUrl) => $@"
        {Styles()}
        <div class=""wrapper"">
          <div class=""header""><h1>{(accepted ? "Request Accepted!" : "Request Update")}</h1></div>
          <div class=""body"">
            <p>Hi {Encode(appt.Name)},</p>
            <p>{(accepted ? "Great news — your appointment request has been accepted." : "Thank you for reaching out. Unfortunately I'm not able to take on this project at this time.")}</p>
            {(string.IsNullOrWhiteSpace(responseMessage) ? "" : $"<div class=\"message-box\">{Encode(responseMessage)}</div>")}
            <p><a href=""{chatUrl}"" class=""btn"">View Conversation</a></p>
          </div>
          {Footer()}
        </div>";

    private string BuildReviewRequestHtml(string reviewerName, string submitUrl) => $@"
        {Styles()}
        <div class=""wrapper"">
          <div class=""header""><h1>Share Your Experience</h1></div>
          <div class=""body"">
            <p>Hi {Encode(reviewerName)},</p>
            <p>I'd love to hear about your experience working with me. Your review helps others understand what it's like to collaborate on a project.</p>
            <p><a href=""{submitUrl}"" class=""btn"">Leave a Review</a></p>
            <p style=""font-size:.85rem;color:#9CA3AF"">This link is personal to you and can only be used once.</p>
          </div>
          {Footer()}
        </div>";

    private string BuildSimpleNotificationHtml(string heading, string actionHtml) => $@"
        {Styles()}
        <div class=""wrapper"">
          <div class=""header""><h1>{Encode(heading)}</h1></div>
          <div class=""body""><p>{actionHtml}</p></div>
          {Footer()}
        </div>";

    private static string Styles() => @"<style>
        body{font-family:Arial,sans-serif;background:#0a0a0f;margin:0;padding:0}
        .wrapper{max-width:600px;margin:32px auto;background:#12121a;border-radius:12px;overflow:hidden;border:1px solid rgba(0,245,255,0.15)}
        .header{background:linear-gradient(135deg,#00f5ff22,#bf00ff22);padding:28px;text-align:center;border-bottom:1px solid rgba(0,245,255,0.2)}
        .header h1{color:#00f5ff;font-size:1.4rem;margin:0}
        .body{padding:28px;color:#e2e8f0}
        .message-box{background:#1e1e2e;border-left:3px solid #00f5ff;padding:14px;white-space:pre-wrap;border-radius:4px;margin:16px 0}
        .btn{display:inline-block;background:linear-gradient(135deg,#00f5ff,#bf00ff);color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold;margin-top:16px}
        .footer{font-size:.78rem;color:#6b7280;border-top:1px solid rgba(255,255,255,0.05);padding:16px 28px;text-align:center}
        </style>";

    private static string Footer() => @"<div class=""footer"">phitdev.com · This is an automated message, please do not reply directly to this email.</div>";

    private static string Encode(string? s) =>
        System.Net.WebUtility.HtmlEncode(s ?? string.Empty);

    // ── SMTP send ────────────────────────────────────────────────────────────

    private async Task SendAsync(string toEmail, string toName, string subject, string htmlBody, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(_opts.SmtpServer))
        {
            logger.LogInformation("[DEV EMAIL] To: {To} | Subject: {Subject}", toEmail, subject);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_opts.FromName, _opts.FromAddress));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = subject;
        message.Body    = new TextPart("html") { Text = htmlBody };

        using var client = new SmtpClient();
        await client.ConnectAsync(_opts.SmtpServer, _opts.SmtpPort, SecureSocketOptions.StartTls, ct);
        await client.AuthenticateAsync(_opts.Username, _opts.Password, ct);
        await client.SendAsync(message, ct);
        await client.DisconnectAsync(true, ct);
    }
}
