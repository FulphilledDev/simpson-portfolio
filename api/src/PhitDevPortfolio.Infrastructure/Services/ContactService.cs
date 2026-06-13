using Microsoft.EntityFrameworkCore;
using PhitDevPortfolio.Application.DTOs;
using PhitDevPortfolio.Application.Interfaces;
using PhitDevPortfolio.Domain.Entities;
using PhitDevPortfolio.Infrastructure.Persistence;

namespace PhitDevPortfolio.Infrastructure.Services;

public class ContactService(AppDbContext db) : IContactService
{
    public async Task<IEnumerable<ContactListItemDto>> GetAllAsync(CancellationToken ct = default)
    {
        var contacts = await db.Contacts
            .AsNoTracking()
            .Include(c => c.ProjectContacts)
            .Include(c => c.Reviews)
            .OrderBy(c => c.Name)
            .ToListAsync(ct);

        return contacts.Select(ToListItemDto);
    }

    public async Task<ContactDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var contact = await db.Contacts
            .AsNoTracking()
            .Include(c => c.ProjectContacts)
            .Include(c => c.Reviews)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        return contact is null ? null : ToDto(contact);
    }

    public async Task<ContactDto> CreateAsync(CreateContactDto dto, CancellationToken ct = default)
    {
        var entity = new Contact
        {
            Name                 = dto.Name,
            Email                = dto.Email,
            Phone                = dto.Phone,
            Company              = dto.Company,
            Notes                = dto.Notes,
            AppointmentRequestId = dto.AppointmentRequestId
        };
        db.Contacts.Add(entity);
        await db.SaveChangesAsync(ct);
        return ToDto(entity);
    }

    public async Task<ContactDto?> UpdateAsync(int id, UpdateContactDto dto, CancellationToken ct = default)
    {
        var contact = await db.Contacts
            .Include(c => c.ProjectContacts)
            .Include(c => c.Reviews)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (contact is null) return null;

        contact.Name    = dto.Name;
        contact.Email   = dto.Email;
        contact.Phone   = dto.Phone;
        contact.Company = dto.Company;
        contact.Notes   = dto.Notes;

        await db.SaveChangesAsync(ct);
        return ToDto(contact);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var contact = await db.Contacts.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (contact is null) return false;
        db.Contacts.Remove(contact);
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<ContactDto> SaveFromAppointmentAsync(int appointmentRequestId, CancellationToken ct = default)
    {
        var appt = await db.AppointmentRequests
            .FirstOrDefaultAsync(a => a.Id == appointmentRequestId, ct)
            ?? throw new InvalidOperationException($"AppointmentRequest {appointmentRequestId} not found.");

        // If a contact was already saved for this appointment, return it
        if (appt.SavedContactId.HasValue)
        {
            var existing = await db.Contacts
                .Include(c => c.ProjectContacts)
                .Include(c => c.Reviews)
                .FirstOrDefaultAsync(c => c.Id == appt.SavedContactId.Value, ct);
            if (existing is not null) return ToDto(existing);
        }

        var contact = new Contact
        {
            Name                 = appt.Name,
            Email                = appt.Email,
            Phone                = appt.Phone,
            Company              = appt.CompanyName,
            AppointmentRequestId = appt.Id
        };
        db.Contacts.Add(contact);
        await db.SaveChangesAsync(ct);

        appt.SavedContactId = contact.Id;
        await db.SaveChangesAsync(ct);

        return ToDto(contact);
    }

    public async Task<IEnumerable<ContactListItemDto>> GetByProjectAsync(int projectId, CancellationToken ct = default)
    {
        var contacts = await db.ProjectContacts
            .AsNoTracking()
            .Where(pc => pc.ProjectId == projectId)
            .Include(pc => pc.Contact)
                .ThenInclude(c => c.ProjectContacts)
            .Include(pc => pc.Contact)
                .ThenInclude(c => c.Reviews)
            .Select(pc => pc.Contact)
            .ToListAsync(ct);

        return contacts.Select(ToListItemDto);
    }

    public async Task AssignToProjectAsync(int contactId, int projectId, CancellationToken ct = default)
    {
        var alreadyExists = await db.ProjectContacts
            .AnyAsync(pc => pc.ContactId == contactId && pc.ProjectId == projectId, ct);

        if (!alreadyExists)
        {
            db.ProjectContacts.Add(new ProjectContact { ContactId = contactId, ProjectId = projectId });
            await db.SaveChangesAsync(ct);
        }
    }

    public async Task RemoveFromProjectAsync(int contactId, int projectId, CancellationToken ct = default)
    {
        var link = await db.ProjectContacts
            .FirstOrDefaultAsync(pc => pc.ContactId == contactId && pc.ProjectId == projectId, ct);

        if (link is not null)
        {
            db.ProjectContacts.Remove(link);
            await db.SaveChangesAsync(ct);
        }
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private static ContactDto ToDto(Contact c) => new(
        c.Id, c.Name, c.Email, c.Phone, c.Company, c.Notes, c.CreatedAt,
        c.AppointmentRequestId,
        c.ProjectContacts.Count,
        c.Reviews.Count);

    private static ContactListItemDto ToListItemDto(Contact c) => new(
        c.Id, c.Name, c.Email, c.Company, c.CreatedAt,
        c.AppointmentRequestId,
        c.ProjectContacts.Count,
        c.Reviews.Count);
}
