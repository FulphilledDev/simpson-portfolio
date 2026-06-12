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
        var chatUrl  = $"{_opts.AppBaseUrl}/appointment/chat/{appt.ClientToken}";
        var body     = BuildClientResponseHtml(appt, accepted, responseMessage, chatUrl);
        await SendAsync(appt.Email, appt.Name, subject, body, ct);
    }

    public async Task SendOwnerNewMessageNotificationAsync(AppointmentRequestDto appt, CancellationToken ct = default)
    {
        var subject  = $"New message from {appt.Name}";
        var adminUrl = $"{_opts.AppBaseUrl}/admin/appointments";
        var body     = BuildSimpleNotificationHtml($"New message from {appt.Name}", "View Conversation", adminUrl);
        await SendAsync(_opts.OwnerEmail, "Portfolio Owner", subject, body, ct);
    }

    public async Task SendClientNewMessageNotificationAsync(AppointmentRequestDto appt, CancellationToken ct = default)
    {
        var subject = "You have a new message";
        var chatUrl = $"{_opts.AppBaseUrl}/appointment/chat/{appt.ClientToken}";
        var body    = BuildSimpleNotificationHtml("You have a new message", "View Message", chatUrl);
        await SendAsync(appt.Email, appt.Name, subject, body, ct);
    }

    public async Task SendClientScheduledTimeAsync(AppointmentRequestDto appt, DateOnly newDate, TimeOnly newTime, bool isUpdate, CancellationToken ct = default)
    {
        var dateTimeStr = $"{newDate:MMMM d, yyyy} at {newTime:h:mm tt}";
        var chatUrl     = $"{_opts.AppBaseUrl}/appointment/chat/{appt.ClientToken}";
        var subject     = isUpdate ? "Your appointment time has been updated" : "An appointment time has been added";
        var body        = BuildScheduledTimeHtml(appt, dateTimeStr, isUpdate, chatUrl);
        await SendAsync(appt.Email, appt.Name, subject, body, ct);
    }

    public async Task SendReviewRequestAsync(string reviewerEmail, string reviewerName, string reviewToken, CancellationToken ct = default)
    {
        var subject    = "You've been invited to leave a review";
        var submitUrl  = $"{_opts.AppBaseUrl}/reviews/submit/{reviewToken}";
        var body       = BuildReviewRequestHtml(reviewerName, submitUrl);
        await SendAsync(reviewerEmail, reviewerName, subject, body, ct);
    }

    public async Task SendResumeAsync(string toEmail, string toName, string fileName, byte[] fileBytes, CancellationToken ct = default)
    {
        var subject  = "Resume \u2013 Philip Simpson";
        var htmlBody = BuildResumeEmailHtml(toName);

        if (string.IsNullOrEmpty(_opts.SmtpServer))
        {
            logger.LogInformation("[DEV EMAIL] Resume to: {To} | File: {File}", toEmail, fileName);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_opts.FromName, _opts.FromAddress));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = subject;

        var builder = new BodyBuilder();
        builder.HtmlBody = htmlBody;
        builder.Attachments.Add(fileName, fileBytes);
        message.Body = builder.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(_opts.SmtpServer, _opts.SmtpPort, MailKit.Security.SecureSocketOptions.StartTls, ct);
        await client.AuthenticateAsync(_opts.Username, _opts.Password, ct);
        await client.SendAsync(message, ct);
        await client.DisconnectAsync(true, ct);
    }

    // ── HTML builders ────────────────────────────────────────────────────────

    private string BuildOwnerNewAppointmentHtml(AppointmentRequestDto appt) => $@"<!DOCTYPE html>
<html lang=""en""><head><meta charset=""UTF-8""><meta name=""viewport"" content=""width=device-width,initial-scale=1""><title>New Appointment Request</title>{Styles()}</head>
<body>
<div class=""outer"">
  <table class=""wrapper"" cellpadding=""0"" cellspacing=""0"">
    <tr><td class=""header"">
      <div class=""logo-mark"">P</div>
      <h1 class=""header-title"">New Appointment Request</h1>
      <p class=""header-sub"">Someone wants to work with you</p>
    </td></tr>
    <tr><td class=""body"">
      <table class=""meta-table"" cellpadding=""0"" cellspacing=""0"">
        <tr><td class=""meta-label"">From</td><td class=""meta-value"">{Encode(appt.Name)}</td></tr>
        <tr><td class=""meta-label"">Email</td><td class=""meta-value"">{Encode(appt.Email)}</td></tr>
        <tr><td class=""meta-label"">Project Type</td><td class=""meta-value"">{appt.ProjectType}</td></tr>
        <tr><td class=""meta-label"">Budget</td><td class=""meta-value"">{Encode(appt.Budget ?? "Not specified")}</td></tr>
      </table>
      <p class=""section-label"">Message</p>
      <div class=""message-box"">{Encode(appt.Message)}</div>
      <div class=""btn-wrap""><a href=""{_opts.AppBaseUrl}/admin/appointments"" class=""btn"">View Request &rarr;</a></div>
    </td></tr>
    <tr><td>{Footer()}</td></tr>
  </table>
</div>
</body></html>";

    private string BuildClientResponseHtml(AppointmentRequestDto appt, bool accepted, string? responseMessage, string chatUrl) => $@"<!DOCTYPE html>
<html lang=""en""><head><meta charset=""UTF-8""><meta name=""viewport"" content=""width=device-width,initial-scale=1""><title>{(accepted ? "Request Accepted" : "Request Update")}</title>{Styles()}</head>
<body>
<div class=""outer"">
  <table class=""wrapper"" cellpadding=""0"" cellspacing=""0"">
    <tr><td class=""header {(accepted ? "header-accepted" : "header-denied")}"">
      <div class=""logo-mark"">{(accepted ? "✓" : "!")}</div>
      <h1 class=""header-title"">{(accepted ? "Request Accepted!" : "Request Update")}</h1>
      <p class=""header-sub"">{(accepted ? "Great news — let's get started" : "Thank you for reaching out")}</p>
    </td></tr>
    <tr><td class=""body"">
      <p class=""greeting"">Hi {Encode(appt.Name)},</p>
      <p class=""body-text"">{(accepted ? "Your appointment request has been <strong>accepted</strong>. You can now chat directly to discuss next steps." : "Thank you for reaching out. Unfortunately I&rsquo;m not able to take on this project at this time.")}</p>
      {(string.IsNullOrWhiteSpace(responseMessage) ? "" : $"<p class=\"section-label\">Message from Philip</p><div class=\"message-box\">{Encode(responseMessage)}</div>")}
      {(accepted ? $"<div class=\"btn-wrap\"><a href=\"{chatUrl}\" class=\"btn\">Open Chat &rarr;</a></div>" : "")}
    </td></tr>
    <tr><td>{Footer()}</td></tr>
  </table>
</div>
</body></html>";

    private string BuildScheduledTimeHtml(AppointmentRequestDto appt, string dateTimeStr, bool isUpdate, string chatUrl) => $@"<!DOCTYPE html>
<html lang=""en""><head><meta charset=""UTF-8""><meta name=""viewport"" content=""width=device-width,initial-scale=1""><title>{(isUpdate ? "Appointment Time Updated" : "Appointment Time Added")}</title>{Styles()}</head>
<body>
<div class=""outer"">
  <table class=""wrapper"" cellpadding=""0"" cellspacing=""0"">
    <tr><td class=""header header-accepted"">
      <div class=""logo-mark"">&#128197;</div>
      <h1 class=""header-title"">{(isUpdate ? "Appointment Time Updated" : "Appointment Time Confirmed")}</h1>
      <p class=""header-sub"">{(isUpdate ? "Your scheduled time has changed" : "A time has been added to your request")}</p>
    </td></tr>
    <tr><td class=""body"">
      <p class=""greeting"">Hi {Encode(appt.Name)},</p>
      <p class=""body-text"">{(isUpdate ? $"Your appointment has been rescheduled to:" : "An appointment time has been added to your request:")}</p>
      <div style=""text-align:center;padding:20px 0"">
        <div style=""display:inline-block;background:rgba(0,245,255,0.06);border:1px solid rgba(0,245,255,0.2);border-radius:12px;padding:16px 32px"">
          <span style=""color:#00f5ff;font-size:1.15rem;font-weight:700;letter-spacing:0.01em"">{Encode(dateTimeStr)}</span>
        </div>
      </div>
      <p class=""body-text"">You can view the details and continue the conversation using the link below.</p>
      <div class=""btn-wrap""><a href=""{chatUrl}"" class=""btn"">View Appointment &rarr;</a></div>
    </td></tr>
    <tr><td>{Footer()}</td></tr>
  </table>
</div>
</body></html>";

    private string BuildReviewRequestHtml(string reviewerName, string submitUrl) => $@"<!DOCTYPE html>
<html lang=""en""><head><meta charset=""UTF-8""><meta name=""viewport"" content=""width=device-width,initial-scale=1""><title>Share Your Experience</title>{Styles()}</head>
<body>
<div class=""outer"">
  <table class=""wrapper"" cellpadding=""0"" cellspacing=""0"">
    <tr><td class=""header header-review"">
      <div class=""logo-mark"">&#9733;</div>
      <h1 class=""header-title"">Share Your Experience</h1>
      <p class=""header-sub"">Your feedback means the world</p>
    </td></tr>
    <tr><td class=""body"">
      <p class=""greeting"">Hi {Encode(reviewerName)},</p>
      <p class=""body-text"">It was a pleasure working with you. I&rsquo;d love to hear about your experience — your review helps others understand what it&rsquo;s like to collaborate on a project together.</p>
      <p class=""body-text"">It only takes 2 minutes.</p>
      <div class=""btn-wrap""><a href=""{submitUrl}"" class=""btn btn-purple"">Leave a Review &rarr;</a></div>
      <p class=""fine-print"">This link is personal to you and can only be used once.</p>
    </td></tr>
    <tr><td>{Footer()}</td></tr>
  </table>
</div>
</body></html>";

    private string BuildResumeEmailHtml(string toName) => $@"<!DOCTYPE html>
<html lang=""en""><head><meta charset=""UTF-8""><meta name=""viewport"" content=""width=device-width,initial-scale=1""><title>Resume &ndash; Philip Simpson</title>{Styles()}</head>
<body>
<div class=""outer"">
  <table class=""wrapper"" cellpadding=""0"" cellspacing=""0"">
    <tr><td class=""header"">
      <div class=""logo-mark"">P</div>
      <h1 class=""header-title"">Philip Simpson</h1>
      <p class=""header-sub"">Full-Stack Developer</p>
    </td></tr>
    <tr><td class=""body"">
      <p class=""greeting"">Hi {Encode(toName)},</p>
      <p class=""body-text"">Thanks for your interest. Please find my resume attached to this email.</p>
      <p class=""body-text"">Feel free to reach out if you have any questions or would like to discuss a project.</p>
      <div class=""btn-wrap""><a href=""{_opts.AppBaseUrl}"" class=""btn"">View Portfolio &rarr;</a></div>
    </td></tr>
    <tr><td>{Footer()}</td></tr>
  </table>
</div>
</body></html>";

    private string BuildSimpleNotificationHtml(string heading, string ctaText, string ctaUrl) => $@"<!DOCTYPE html>
<html lang=""en""><head><meta charset=""UTF-8""><meta name=""viewport"" content=""width=device-width,initial-scale=1""><title>{Encode(heading)}</title>{Styles()}</head>
<body>
<div class=""outer"">
  <table class=""wrapper"" cellpadding=""0"" cellspacing=""0"">
    <tr><td class=""header"">
      <div class=""logo-mark"">&#9993;</div>
      <h1 class=""header-title"">{Encode(heading)}</h1>
    </td></tr>
    <tr><td class=""body"">
      <div class=""btn-wrap""><a href=""{ctaUrl}"" class=""btn"">{Encode(ctaText)} &rarr;</a></div>
    </td></tr>
    <tr><td>{Footer()}</td></tr>
  </table>
</div>
</body></html>";

    private static string Styles() => @"<style>
      body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
      body{margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif}
      .outer{padding:32px 16px}
      .wrapper{max-width:600px;margin:0 auto;background:#0f0f1a;border-radius:16px;overflow:hidden;border-collapse:collapse;width:100%;border:1px solid rgba(0,245,255,0.12)}
      .header{padding:40px 32px;text-align:center;background:linear-gradient(160deg,#0d1a2e 0%,#0f0a1f 100%);border-bottom:1px solid rgba(0,245,255,0.15)}
      .header-accepted{background:linear-gradient(160deg,#0d2e1a 0%,#0a1f12 100%);border-bottom-color:rgba(0,245,180,0.2)}
      .header-denied{background:linear-gradient(160deg,#2e0d0d 0%,#1f0a0a 100%);border-bottom-color:rgba(255,80,80,0.2)}
      .header-review{background:linear-gradient(160deg,#1a0d2e 0%,#0f0a1f 100%);border-bottom-color:rgba(191,0,255,0.2)}
      .logo-mark{display:inline-block;width:52px;height:52px;line-height:52px;border-radius:14px;background:linear-gradient(135deg,#00f5ff,#bf00ff);color:#fff;font-size:1.4rem;font-weight:700;text-align:center;margin-bottom:16px;box-shadow:0 0 24px rgba(0,245,255,0.35)}
      .header-title{color:#00f5ff;font-size:1.5rem;font-weight:700;margin:0 0 6px;letter-spacing:-0.02em}
      .header-sub{color:#8892b0;font-size:.9rem;margin:0}
      .body{padding:32px;color:#cbd5e1;font-size:.95rem;line-height:1.7}
      .greeting{font-size:1.05rem;color:#e2e8f0;margin:0 0 12px;font-weight:500}
      .body-text{color:#94a3b8;margin:0 0 16px}
      .meta-table{width:100%;border-collapse:collapse;margin-bottom:24px;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,0.06)}
      .meta-label{background:#131320;color:#64748b;font-size:.8rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;padding:10px 14px;width:120px;border-bottom:1px solid rgba(255,255,255,0.04)}
      .meta-value{background:#0f0f1c;color:#e2e8f0;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.04)}
      .section-label{font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin:0 0 8px}
      .message-box{background:#0a0a14;border-left:3px solid #00f5ff;padding:16px;white-space:pre-wrap;border-radius:0 8px 8px 0;margin-bottom:24px;color:#cbd5e1;font-size:.9rem;line-height:1.6}
      .btn-wrap{text-align:center;padding:8px 0 16px}
      .btn{display:inline-block;background:linear-gradient(135deg,#00f5ff,#7b2fff);color:#fff !important;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:.95rem;letter-spacing:.02em;box-shadow:0 0 20px rgba(0,245,255,0.25)}
      .btn-purple{background:linear-gradient(135deg,#bf00ff,#7b2fff);box-shadow:0 0 20px rgba(191,0,255,0.25)}
      .fine-print{font-size:.78rem;color:#475569;text-align:center;margin-top:8px}
      .footer-cell{padding:20px 32px;background:#080810;border-top:1px solid rgba(255,255,255,0.05);text-align:center}
      .footer-brand{color:#00f5ff;font-weight:700;font-size:.9rem;letter-spacing:.04em;margin-bottom:4px}
      .footer-text{color:#334155;font-size:.75rem}
    </style>";

    private string Footer() => $@"<div class=""footer-cell"">
      <div class=""footer-brand"">PHITDEV</div>
      <div class=""footer-text"">Philip Simpson &middot; Full-Stack Developer &middot; <a href=""{_opts.AppBaseUrl}"" style=""color:#334155"">{_opts.AppBaseUrl.Replace("http://", "").Replace("https://", "")}</a></div>
      <div class=""footer-text"" style=""margin-top:6px"">This is an automated message &mdash; please do not reply directly to this email.</div>
    </div>";

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
