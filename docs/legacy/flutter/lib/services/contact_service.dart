import 'dart:convert';
import 'package:flutter/services.dart';
import '../models/contact.dart';

class ContactService {
  Future<List<Contact>> loadContacts() async {
    // Simulamos un tiempo de carga (como si fuera una red)
    await Future.delayed(const Duration(milliseconds: 800));
    
    try {
      final String jsonString = await rootBundle.loadString('assets/data/contacts.json');
      final List<dynamic> jsonList = json.decode(jsonString);
      return jsonList.map((json) => Contact.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Error al cargar contactos: $e');
    }
  }
}
