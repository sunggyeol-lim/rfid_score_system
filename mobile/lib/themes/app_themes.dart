import 'package:flutter/material.dart';

// 테마 메타데이터 구조체
class ThemeMeta {
  final String id;
  final String name;
  final String mascot;
  final ThemeData themeData;

  ThemeMeta({
    required this.id,
    required this.name,
    required this.mascot,
    required this.themeData,
  });
}

class AppThemes {
  // 1. 🐝 꿀벌반 테마
  static final ThemeData honeybeeTheme = ThemeData(
    primaryColor: const Color(0xFFF5B041),
    scaffoldBackgroundColor: const Color(0xFFFEF9E7),
    cardColor: const Color(0xFFFCF3CF),
    colorScheme: ColorScheme.fromSeed(
      seedColor: const Color(0xFFF5B041),
      primary: const Color(0xFFF5B041),
      secondary: const Color(0xFF873600),
    ),
    textTheme: const TextTheme(
      bodyLarge: TextStyle(color: Color(0xFF5D4037), fontFamily: 'Outfit'),
      titleLarge: TextStyle(color: Color(0xFF5D4037), fontWeight: FontWeight.bold),
    ),
    useMaterial3: true,
  );

  // 2. 🐬 조개반 테마
  static final ThemeData oceanTheme = ThemeData(
    primaryColor: const Color(0xFF2980B9),
    scaffoldBackgroundColor: const Color(0xFFEBF5FB),
    cardColor: const Color(0xFFD4E6F1),
    colorScheme: ColorScheme.fromSeed(
      seedColor: const Color(0xFF2980B9),
      primary: const Color(0xFF2980B9),
      secondary: const Color(0xFF1A5276),
    ),
    textTheme: const TextTheme(
      bodyLarge: TextStyle(color: Color(0xFF1A5276), fontFamily: 'Outfit'),
      titleLarge: TextStyle(color: Color(0xFF1A5276), fontWeight: FontWeight.bold),
    ),
    useMaterial3: true,
  );

  // 3. 🎈 새싹반 테마
  static final ThemeData kidsTheme = ThemeData(
    primaryColor: const Color(0xFFEC7063),
    scaffoldBackgroundColor: const Color(0xFFFDF2E9),
    cardColor: const Color(0xFFFADBD8),
    colorScheme: ColorScheme.fromSeed(
      seedColor: const Color(0xFFEC7063),
      primary: const Color(0xFFEC7063),
      secondary: const Color(0xFF78281F),
    ),
    textTheme: const TextTheme(
      bodyLarge: TextStyle(color: Color(0xFF78281F), fontFamily: 'Outfit'),
      titleLarge: TextStyle(color: Color(0xFF78281F), fontWeight: FontWeight.bold),
    ),
    useMaterial3: true,
  );

  // 테마 리스트 맵
  static final Map<String, ThemeMeta> allThemes = {
    'honeybee': ThemeMeta(
      id: 'honeybee',
      name: '꿀벌반',
      mascot: '🐝',
      themeData: honeybeeTheme,
    ),
    'ocean': ThemeMeta(
      id: 'ocean',
      name: '조개반',
      mascot: '🐬',
      themeData: oceanTheme,
    ),
    'kids': ThemeMeta(
      id: 'kids',
      name: '새싹반',
      mascot: '🎈',
      themeData: kidsTheme,
    ),
  };
}
