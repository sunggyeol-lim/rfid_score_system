import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // 로컬 개발 시 호스트 IP에 맞춰 변경 가능
  // 안드로이드 에뮬레이터: 10.0.2.2
  // iOS 시뮬레이터 또는 로컬 웹 빌드: localhost
  static const String baseUrl = 'http://localhost:3000'; // 실제 환경에 따라 호스트 변경 필요

  // 1. 학생 목록 가져오기
  static Future<List<dynamic>> fetchStudents() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/api/students'));
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to load students');
      }
    } catch (e) {
      print('Error fetching students: $e');
      rethrow;
    }
  }

  // 2. 점수 부여 API 호출
  static Future<Map<String, dynamic>> submitScore(String rfidId, int scoreAdded) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/score'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'rfid_id': rfidId,
          'score_added': scoreAdded,
        }),
      );
      
      return jsonDecode(response.body);
    } catch (e) {
      print('Error submitting score: $e');
      return {'success': false, 'error': e.toString()};
    }
  }
}
