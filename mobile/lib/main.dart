import 'package:flutter/material.dart';
import 'screens/score_input.dart';
import 'themes/app_themes.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  // 기본 테마: 꿀벌
  String _currentThemeId = 'honeybee';

  @override
  Widget build(BuildContext context) {
    // 활성화된 테마 데이터 검색
    final themeMeta = AppThemes.allThemes[_currentThemeId]!;

    return MaterialApp(
      title: 'RFID 스코어 모바일',
      debugShowCheckedModeBanner: false,
      // 테마 동적 바인딩
      theme: themeMeta.themeData,
      home: ScoreInputScreen(
        currentThemeId: _currentThemeId,
        onThemeChanged: (newThemeId) {
          setState(() {
            _currentThemeId = newThemeId;
          });
        },
      ),
    );
  }
}
