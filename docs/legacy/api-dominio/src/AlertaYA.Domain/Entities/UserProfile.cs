using AlertaYA.Domain.ValueObjects;

namespace AlertaYA.Domain.Entities;

public sealed class UserProfile
{
    public Guid Id { get; }
    public PersonName Name { get; private set; }
    public PhoneNumber Phone { get; private set; }
    public DateTimeOffset CreatedAt { get; }

    /// <summary>Derivadas del nombre, nunca almacenadas.</summary>
    public string Initials => Name.Initials;

    private UserProfile(Guid id, PersonName name, PhoneNumber phone, DateTimeOffset createdAt)
    {
        Id = id;
        Name = name;
        Phone = phone;
        CreatedAt = createdAt;
    }

    public static UserProfile Create(Guid id, string? name, string? phone, DateTimeOffset createdAt)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("El identificador de la cuenta es obligatorio.", nameof(id));
        }

        return new UserProfile(id, PersonName.Create(name), PhoneNumber.Create(phone), createdAt);
    }

    public void Rename(string? name) => Name = PersonName.Create(name);

    public void ChangePhone(string? phone) => Phone = PhoneNumber.Create(phone);
}
