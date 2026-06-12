using PhitDevPortfolio.Domain.Enums;

namespace PhitDevPortfolio.Application.DTOs;

public record AvailabilitySlotDto(
    int Id,
    string Title,
    DateOnly Date,
    TimeOnly? StartTime,
    TimeOnly? EndTime,
    AvailabilitySlotType Type,
    bool IsPublic,
    string? Notes,
    int? AppointmentRequestId
);

public record UpsertAvailabilitySlotDto(
    string Title,
    DateOnly Date,
    TimeOnly? StartTime,
    TimeOnly? EndTime,
    AvailabilitySlotType Type,
    bool IsPublic,
    string? Notes,
    int? AppointmentRequestId
);

public record BlockedSlotDto(
    int Id,
    DateTimeOffset Start,
    DateTimeOffset End,
    string? Reason
);

public record UpsertBlockedSlotDto(
    DateTimeOffset Start,
    DateTimeOffset End,
    string? Reason
);
