using Microsoft.EntityFrameworkCore;
using PhitDevPortfolio.Domain.Entities;

namespace PhitDevPortfolio.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AppointmentRequest> AppointmentRequests => Set<AppointmentRequest>();
    public DbSet<AppointmentMessage> AppointmentMessages => Set<AppointmentMessage>();
    public DbSet<Contact> Contacts => Set<Contact>();
    public DbSet<ProjectContact> ProjectContacts => Set<ProjectContact>();
    public DbSet<WeeklyAvailability> WeeklyAvailabilities => Set<WeeklyAvailability>();
    public DbSet<BlockedSlot> BlockedSlots => Set<BlockedSlot>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<AdminSettings> AdminSettings => Set<AdminSettings>();
    public DbSet<ResumeVersion> ResumeVersions => Set<ResumeVersion>();
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

        // WeeklyAvailability — one record per day of week
        builder.Entity<WeeklyAvailability>(e =>
        {
            e.HasIndex(x => x.DayOfWeek).IsUnique();
            e.Property(x => x.DayOfWeek).HasConversion<int>();
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
            // A contact can only leave one review per project
            e.HasIndex(x => new { x.ContactId, x.ProjectId })
             .IsUnique()
             .HasFilter("\"ProjectId\" IS NOT NULL");
            e.HasOne(x => x.Project).WithMany().HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Contact).WithMany(c => c.Reviews).HasForeignKey(x => x.ContactId).OnDelete(DeleteBehavior.Restrict);
        });

        // Contact
        builder.Entity<Contact>(e =>
        {
            // Contact.AppointmentRequestId → the appointment this contact was sourced from
            e.HasOne(x => x.AppointmentRequest)
             .WithMany()
             .HasForeignKey(x => x.AppointmentRequestId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // AppointmentRequest.SavedContactId → the contact created from this appointment
        builder.Entity<AppointmentRequest>(e =>
        {
            e.HasOne(x => x.SavedContact)
             .WithMany()
             .HasForeignKey(x => x.SavedContactId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // ProjectContact — composite PK, many-to-many
        builder.Entity<ProjectContact>(e =>
        {
            e.HasKey(x => new { x.ProjectId, x.ContactId });
            e.HasOne(x => x.Project)
             .WithMany(p => p.ProjectContacts)
             .HasForeignKey(x => x.ProjectId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Contact)
             .WithMany(c => c.ProjectContacts)
             .HasForeignKey(x => x.ContactId)
             .OnDelete(DeleteBehavior.Cascade);
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
                OwnerName = "Philip Simpson",
                OwnerTitle = "Full-Stack Developer",
                AppointmentDurationMinutes = 30
            });
        });

        // ResumeVersion
        builder.Entity<ResumeVersion>(e =>
        {
            e.HasIndex(x => x.IsActive).HasFilter("\"IsActive\" = true");
        });

        // GoogleCalendarConnection — soft-delete via IsActive
        builder.Entity<GoogleCalendarConnection>(e =>
        {
            e.HasIndex(x => x.IsActive);
        });
    }
}
