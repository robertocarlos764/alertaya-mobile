using AlertaYA.Domain.ValueObjects;

namespace AlertaYA.Domain.Entities;

/// <summary>
/// Contacto de confianza que recibe el aviso cuando se activa una alerta.
/// </summary>
public sealed class Contact
{
    public Guid Id { get; }
    public Guid UserId { get; }
    public PersonName Name { get; private set; }
    public PhoneNumber Phone { get; private set; }
    public string? ColorHex { get; private set; }
    public string? AvatarUrl { get; private set; }
    public DateTimeOffset CreatedAt { get; }

    /// <summary>Derivadas del nombre, nunca almacenadas.</summary>
    public string Initials => Name.Initials;

    private Contact(
        Guid id,
        Guid userId,
        PersonName name,
        PhoneNumber phone,
        string? colorHex,
        string? avatarUrl,
        DateTimeOffset createdAt)
    {
        Id = id;
        UserId = userId;
        Name = name;
        Phone = phone;
        ColorHex = colorHex;
        AvatarUrl = avatarUrl;
        CreatedAt = createdAt;
    }

    public static Contact Create(
        Guid id,
        Guid userId,
        string? name,
        string? phone,
        DateTimeOffset createdAt,
        string? colorHex = null,
        string? avatarUrl = null)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("El contacto debe pertenecer a una cuenta.", nameof(userId));
        }

        return new Contact(
            id,
            userId,
            PersonName.Create(name),
            PhoneNumber.Create(phone),
            colorHex,
            avatarUrl,
            createdAt);
    }

    public bool BelongsTo(Guid userId) => UserId == userId;
}
