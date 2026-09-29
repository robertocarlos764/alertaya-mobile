import 'dart:convert';
import 'package:flutter/services.dart';
import '../../core/domain/entities/contact.dart';

class AssetContactDatasource {
  Future<List<Contact>> getContacts() async {
    await Future.delayed(const Duration(milliseconds: 800));
    final String jsonString = await rootBundle.loadString('assets/data/contacts.json');
    final List<dynamic> jsonList = json.decode(jsonString);
    return jsonList.map((json) => Contact.fromJson(json)).toList();
  }
}
