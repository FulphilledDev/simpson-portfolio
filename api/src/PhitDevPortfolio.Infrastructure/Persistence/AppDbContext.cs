using Microsoft.EntityFrameworkCore;
using PhitDevPortfolio.Domain.Entities;
using PhitDevPortfolio.Domain.Enums;

namespace PhitDevPortfolio.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AppointmentRequest> AppointmentRequests => Set<AppointmentRequest>();
    public DbSet<AppointmentMessage> AppointmentMessages => Set<AppointmentMessage>();
    public DbSet<AvailabilitySlot> AvailabilitySlots => Set<AvailabilitySlot>();
    public DbSet<BlockedSlot> BlockedSlots => Set<BlockedSlot>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<AdminSettings> AdminSettings => Set<AdminSettings>();
    public DbSet<GoogleCalendarConnection> GoogleCalendarConnections => Set<GoogleCalendarConnection>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // AppointmentRequest
        builder.Entity<AppointmentRequest>(e =>
        {
            e.HasIndex(x => x.ClientToken).IsUnique();
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.ProjectType).HasConversion<string>().HasMaxLength(30);
            e.HasMany(x => x.Messages)
             .WithOne(m => m.AppointmentRequest)
             .HasForeignKey(m => m.AppointmentRequestId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // AppointmentMessage
        builder.Entity<AppointmentMessage>(e =>
        {
            e.Property(x => x.Sender).HasConversion<string>().HasMaxLength(20);
        });

        // AvailabilitySlot
        builder.Entity<AvailabilitySlot>(e =>
        {
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(30);
        });

        // Project — slug must be unique
        builder.Entity<Project>(e =>
        {
            e.HasIndex(x => x.Slug).IsUnique();
        });

        // Review — token must be unique, single-use (SubmittedAt acts as consumed flag)
        builder.Entity<Review>(e =>
        {
            e.HasIndex(x => x.ReviewToken).IsUnique();
        });

        // AdminSettings — singleton, Id always = 1
        builder.Entity<AdminSettings>(e =>
        {
            e.HasData(new AdminSettings
            {
                Id = 1,
                Bio = string.Empty,
                Skills = "[]",
                ContactEmail = string.Empty,
                OwnerName = "Phillip Simpson",
                OwnerTitle = "Full-Stack Developer"
            });
        });

        // GoogleCalendarConnection — soft-delete via IsActive
        builder.Entity<GoogleCalendarConnection>(e =>
        {
            e.HasIndex(x => x.IsActive);
        });
    }
}
