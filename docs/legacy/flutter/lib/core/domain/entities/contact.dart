class Contact {
  final String id;
  final String name;
  final String initials;
  final String phoneNumber;
  final String colorHex;
  final String? avatarUrl;

  Contact({
    required this.id,
    required this.name,
    required this.initials,
    required this.phoneNumber,
    required this.colorHex,
    this.avatarUrl,
  });

  factory Contact.fromJson(Map<String, dynamic> json) {
    return Contact(
      id: json['id'] as String,
      name: json['name'] as String,
      initials: json['initials'] as String,
      phoneNumber: json['phoneNumber'] as String,
      colorHex: json['colorHex'] as String,
      avatarUrl: json['avatarUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'initials': initials,
      'phoneNumber': phoneNumber,
      'colorHex': colorHex,
      'avatarUrl': avatarUrl,
    };
  }
}
