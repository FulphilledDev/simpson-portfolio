using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PhitDevPortfolio.Application.Interfaces;
using PhitDevPortfolio.Application.Options;
using PhitDevPortfolio.Infrastructure.Persistence;
using PhitDevPortfolio.Infrastructure.Services;
using PhitDevPortfolio.API.Hubs;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ── Options ───────────────────────────────────────────────────────────────────
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection("Email"));
builder.Services.Configure<AzureOptions>(builder.Configuration.GetSection("Azure"));
builder.Services.Configure<GoogleOptions>(builder.Configuration.GetSection("Google"));

// ── Database (PostgreSQL via Npgsql) ─────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsql => npgsql.EnableRetryOnFailure(3)));

// ── JWT Authentication ────────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key is not configured.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"],
            ValidAudience            = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
        // Allow JWT via SignalR query string
        opts.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var token = ctx.Request.Query["access_token"];
                var path  = ctx.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(token) &&
                    (path.StartsWithSegments("/hubs") ||
                     path.StartsWithSegments("/api/googlecalendar/connect")))
                    ctx.Token = token;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ── CORS ──────────────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(opts => opts.AddDefaultPolicy(policy =>
    policy.WithOrigins(allowedOrigins)
          .AllowAnyHeader()
          .AllowAnyMethod()
          .AllowCredentials()));

// ── SignalR ───────────────────────────────────────────────────────────────────
builder.Services.AddSignalR()
    .AddJsonProtocol(opts =>
        opts.PayloadSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase);

// ── HttpClient (Google OAuth token exchange) ──────────────────────────────────
builder.Services.AddHttpClient();

// ── Application Services ──────────────────────────────────────────────────────
builder.Services.AddScoped<ITokenService,              TokenService>();
builder.Services.AddScoped<IEmailService,              EmailService>();
builder.Services.AddScoped<IBlobStorageService,        BlobStorageService>();
builder.Services.AddScoped<IAdminSettingsService,      AdminSettingsService>();
builder.Services.AddScoped<IResumeVersionService,      ResumeVersionService>();
builder.Services.AddScoped<IAppointmentService,        AppointmentService>();
builder.Services.AddScoped<IAppointmentMessageService, AppointmentMessageService>();
builder.Services.AddScoped<IProjectService,            ProjectService>();
builder.Services.AddScoped<IReviewService,             ReviewService>();
builder.Services.AddScoped<IContactService,            ContactService>();
builder.Services.AddScoped<IWeeklyAvailabilityService,    WeeklyAvailabilityService>();
builder.Services.AddScoped<IBlockedSlotService,           BlockedSlotService>();
builder.Services.AddScoped<IGoogleCalendarService,     GoogleCalendarService>();
builder.Services.AddScoped<IAboutSectionService,       AboutSectionService>();
builder.Services.AddScoped<IAboutAssetService,         AboutSectionService>();

// ── Swagger ───────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "phitdev Portfolio API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header, Name = "Authorization",
        Type = SecuritySchemeType.Http, Scheme = "bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, [] }
    });
});

builder.Services.AddControllers();

var app = builder.Build();

// ── Dev pipeline ──────────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseStaticFiles();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<AppointmentChatHub>("/hubs/appointment-chat");

app.Run();
