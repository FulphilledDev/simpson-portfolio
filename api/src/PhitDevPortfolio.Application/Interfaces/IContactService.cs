using PhitDevPortfolio.Application.DTOs;

namespace PhitDevPortfolio.Application.Interfaces;

public interface IContactService
{
    Task<IEnumerable<ContactListItemDto>> GetAllAsync(CancellationToken ct = default);
    Task<ContactDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<ContactDto> CreateAsync(CreateContactDto dto, CancellationToken ct = default);
    Task<ContactDto?> UpdateAsync(int id, UpdateContactDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);

    // ── Save-as-contact from appointment ─────────────────────────────────────
    Task<ContactDto> SaveFromAppointmentAsync(int appointmentRequestId, CancellationToken ct = default);

    // ── Project associations ──────────────────────────────────────────────────
    Task<IEnumerable<ContactListItemDto>> GetByProjectAsync(int projectId, CancellationToken ct = default);
    Task AssignToProjectAsync(int contactId, int projectId, CancellationToken ct = default);
    Task RemoveFromProjectAsync(int contactId, int projectId, CancellationToken ct = default);
}
