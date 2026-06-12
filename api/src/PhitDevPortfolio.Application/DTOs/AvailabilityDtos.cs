namespace PhitDevPortfolio.Application.DTOs;

/// <summary>Owner's recurring availability for a specific day of the week.</summary>
public record WeeklyAvailabilityDto(
    int Id,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    bool IsEnabled
);

public record UpsertWeeklyAvailabilityDto(
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    bool IsEnabled
);

/// <summary>Available start times returned for a specific calendar date.</summary>
public record DayAvailabilityDto(
    bool IsAvailable,
    IEnumerable<string> AvailableStartTimes  // "HH:mm" format
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
