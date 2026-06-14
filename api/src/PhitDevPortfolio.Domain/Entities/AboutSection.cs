namespace PhitDevPortfolio.Domain.Entities;

/// <summary>Singleton (Id always = 1). Manages the public "About Me" section content.</summary>
public class AboutSection
{
    public int Id { get; set; } = 1;

    /// <summary>
    /// The catch-phrase headline displayed in the About Me section.
    /// e.g. "Forged in Challenge. Built for Results."
    /// </summary>
    [System.ComponentModel.DataAnnotations.MaxLength(300)]
    public string? Header { get; set; }

    /// <summary>
    /// JSON array of principles: [{icon, name, description}].
    /// Falls back to hardcoded defaults on the frontend if null/empty.
    /// </summary>
    public string Principles { get; set; } = "[]";

    /// <summary>URL of the photo displayed in the About Me section (distinct from the hero profile photo).</summary>
    public string? AboutPhotoUrl { get; set; }
}
