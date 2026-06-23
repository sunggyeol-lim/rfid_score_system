import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../themes/app_themes.dart';
import 'package:nfc_manager/nfc_manager.dart'; // [2단계] 실물 NFC 스캔 대비

class ScoreInputScreen extends StatefulWidget {
  final Function(String) onThemeChanged;
  final String currentThemeId;

  const ScoreInputScreen({
    super.key,
    required this.onThemeChanged,
    required this.currentThemeId,
  });

  @override
  State<ScoreInputScreen> createState() => _ScoreInputScreenState();
}

class _ScoreInputScreenState extends State<ScoreInputScreen> {
  int _selectedScore = 10;
  List<dynamic> _students = [];
  String? _selectedRfidId;
  final TextEditingController _customRfidController = TextEditingController();
  bool _isCustomInputMode = false;
  bool _isNfcScanning = false;
  bool _isLoadingStudents = false;

  @override
  void initState() {
    super.initState();
    _loadStudents();
  }

  // 백엔드로부터 학생 리스트 패치
  Future<void> _loadStudents() async {
    setState(() => _isLoadingStudents = true);
    try {
      final list = await ApiService.fetchStudents();
      setState(() {
        _students = list;
        _isLoadingStudents = false;
      });
    } catch (e) {
      setState(() => _isLoadingStudents = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('학생 데이터를 가져오지 못했습니다. 서버를 확인해주세요: $e')),
      );
    }
  }

  // 점수 부여 실행 API 전송
  Future<void> _submitScore(String rfidId) async {
    final result = await ApiService.submitScore(rfidId, _selectedScore);
    
    if (mounted) {
      if (result['success'] == true) {
        final studentName = result['student']['name'];
        final totalScore = result['student']['score'];
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('🎯 $studentName에게 $_selectedScore점 부여 완료! (총: $totalScore점)'),
            backgroundColor: Colors.green,
          ),
        );
        // 리스트 점수 동기화를 위해 재로드
        _loadStudents();
      } else {
        if (result['error'] == 'unknown_tag') {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('⚠️ 미등록 카드 감지! ID: ${result['rfid_id']}\n웹 대시보드에서 등록창을 확인하세요.'),
              backgroundColor: Colors.orange,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('❌ 전송 실패: ${result['error']}'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  // [2단계] 스마트폰 내장 NFC 센서 스캐닝 작동 모듈
  void _startNfcSession() async {
    // 기기 NFC 활성화 여부 점검
    bool isAvailable = await NfcManager.instance.isAvailable();
    if (!isAvailable) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ 이 기기에서는 내장 NFC 기능을 사용할 수 없거나 꺼져 있습니다.')),
      );
      return;
    }

    setState(() => _isNfcScanning = true);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('📳 학생의 NFC 카드/스티커를 스마트폰 뒷면에 태그해주세요...'),
        duration: Duration(seconds: 10),
      ),
    );

    // NFC 세션 구동 (2단계 실물 카드 연동의 핵심)
    NfcManager.instance.startSession(
      onDiscovered: (NfcTag tag) async {
        try {
          // 태그 고유 UID 파싱 (플랫폼별 파싱 상이)
          String? rfidId;
          
          // Android Ndef / IsoDep
          var ndef = Ndef.from(tag);
          var identifier = tag.data['isodep']?['identifier'] ?? tag.data['nfca']?['identifier'];
          
          if (identifier != null) {
            rfidId = (identifier as List<int>)
                .map((e) => e.toRadixString(16).padLeft(2, '0'))
                .join('')
                .toUpperCase();
          }

          if (rfidId == null || rfidId.isEmpty) {
            rfidId = "NFC_${DateTime.now().millisecondsSinceEpoch}";
          }

          print('🚀 NFC Tag Discovered: $rfidId');
          
          // 점수 부여 실행
          await _submitScore(rfidId);
          
          NfcManager.instance.stopSession();
          setState(() => _isNfcScanning = false);
        } catch (e) {
          print('NFC processing error: $e');
          NfcManager.instance.stopSession(errorMessage: '인식 오류');
          setState(() => _isNfcScanning = false);
        }
      },
    );
  }

  void _stopNfcSession() {
    NfcManager.instance.stopSession();
    setState(() => _isNfcScanning = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('NFC 스캔이 중단되었습니다.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final themeMeta = AppThemes.allThemes[widget.currentThemeId]!;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text('${themeMeta.mascot} NFC 리더기'),
        backgroundColor: theme.primaryColor,
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadStudents,
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // 1. 테마 셀렉터 칩스 (웹 대시보드와 싱크)
            Column(
              children: [
                Text(
                  '🎨 학급 테마 설정',
                  style: theme.textTheme.titleLarge?.copyWith(fontSize: 18),
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: AppThemes.allThemes.keys.map((themeId) {
                    final meta = AppThemes.allThemes[themeId]!;
                    final isActive = widget.currentThemeId == themeId;
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 5.0),
                      child: ChoiceChip(
                        label: Text('${meta.mascot} ${meta.name}'),
                        selected: isActive,
                        onSelected: (_) => widget.onThemeChanged(themeId),
                        selectedColor: theme.primaryColor,
                        labelStyle: TextStyle(
                          color: isActive ? Colors.white : theme.textTheme.bodyLarge?.color,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),

            // 2. 점수 선택기 칩스
            Column(
              children: [
                Text(
                  '🎯 부여할 점수 설정',
                  style: theme.textTheme.titleLarge?.copyWith(fontSize: 18),
                ),
                const SizedBox(height: 15),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [10, 5, 1, -5].map((score) {
                    final isSelected = _selectedScore == score;
                    return InkWell(
                      onTap: () {
                        setState(() => _selectedScore = score);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                        decoration: BoxDecoration(
                          color: isSelected ? theme.primaryColor : theme.cardColor,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: theme.primaryColor, width: 2),
                          boxShadow: isSelected
                              ? [BoxShadow(color: theme.primaryColor.withOpacity(0.4), blurRadius: 10, offset: const Offset(0, 4))]
                              : null,
                        ),
                        child: Text(
                          score > 0 ? '+$score' : '$score',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: isSelected ? Colors.white : theme.textTheme.bodyLarge?.color,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),

            // 3. 1단계 가상 스캔 컨트롤러
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: theme.cardColor.withOpacity(0.5),
                borderRadius: BorderRadius.circular(30),
                border: Border.all(color: theme.primaryColor.withOpacity(0.3)),
              ),
              child: Column(
                children: [
                  Text(
                    '💿 가상 카드 인식 (시뮬레이터)',
                    style: theme.textTheme.titleLarge?.copyWith(fontSize: 16),
                  ),
                  const SizedBox(height: 15),
                  if (!_isCustomInputMode) ...[
                    // 학생 드롭다운
                    _isLoadingStudents
                        ? const CircularProgressIndicator()
                        : DropdownButtonFormField<String>(
                            value: _selectedRfidId,
                            decoration: InputDecoration(
                              filled: true,
                              fillColor: Colors.white,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(15)),
                            ),
                            items: _students.map<DropdownMenuItem<String>>((student) {
                              return DropdownMenuItem<String>(
                                value: student['rfid_id'],
                                child: Text("${student['name']} (${student['rfid_id']})"),
                              );
                            }).toList(),
                            onChanged: (val) {
                              setState(() => _selectedRfidId = val);
                            },
                            hint: const Text('태그할 학생 선택'),
                          ),
                  ] else ...[
                    // 가상 임의 카드 입력 폼
                    TextField(
                      controller: _customRfidController,
                      decoration: InputDecoration(
                        labelText: '임의의 8자리 카드 ID 입력',
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(15)),
                      ),
                    ),
                  ],
                  const SizedBox(height: 10),
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        _isCustomInputMode = !_isCustomInputMode;
                        _selectedRfidId = null;
                      });
                    },
                    child: Text(
                      _isCustomInputMode ? '목록에서 학생 선택하기' : '미등록 임의 카드 직접 태깅하기',
                      style: TextStyle(
                        color: theme.colorScheme.secondary,
                        decoration: TextDecoration.underline,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // 4. 전송 버튼 영역 (시뮬레이션 전송 및 실물 NFC 핫버튼)
            Column(
              children: [
                // 가상 스캔 전송 버튼
                ElevatedButton(
                  onPressed: () {
                    String? rfid;
                    if (_isCustomInputMode) {
                      rfid = _customRfidController.text.trim().toUpperCase();
                      if (rfid.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('가상 카드 ID를 입력하세요.')),
                        );
                        return;
                      }
                    } else {
                      rfid = _selectedRfidId;
                      if (rfid == null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('태그할 대상을 먼저 선택하세요.')),
                        );
                        return;
                      }
                    }
                    _submitScore(rfid);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: theme.primaryColor,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 60),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  child: const Text('🎯 점수 부여 (가상 태깅)', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 10),
                
                // [2단계 대비] 실제 내장 NFC 리더기 켜기 토글 버튼
                OutlinedButton.icon(
                  onPressed: _isNfcScanning ? _stopNfcSession : _startNfcSession,
                  icon: Icon(_isNfcScanning ? Icons.portable_wifi_off : Icons.nfc, color: theme.colorScheme.secondary),
                  label: Text(
                    _isNfcScanning ? '스캐닝 끄기 (NFC OFF)' : '실물 태그 스캔하기 (NFC ON)',
                    style: TextStyle(color: theme.colorScheme.secondary, fontWeight: FontWeight.bold),
                  ),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 50),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    side: BorderSide(color: theme.colorScheme.secondary, width: 2),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
